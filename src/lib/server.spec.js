require('babel-polyfill');

import test from 'tape';
import Ajv from 'ajv';
// JSON-Schema validator
const ajv = new Ajv();
import Server from './server';
import requestPromise from 'request-promise';
import HTTPStatus from 'http-status';
import db from './db-manager';
import { mongodbConfig } from '../config';
import { GET, POST, PUT } from './utils/restful-test';
import { createTestingDb, dropTestingDb } from './utils/database-migration';

// MongoDB Driver
const mongo = require('mongodb').MongoClient;

test('MongoDB basic connection', async t => {
  db.init(mongodbConfig);
  await db.connect();

  // Drop previous database
  await db.query.dropDatabase();
  // Create collection
  await db.query.createCollection('restaurants');
  await db.query.collection('restaurants').insert(require('./mock-db.js'));
  const result = await db.query
    .collection('restaurants')
    .find({}, { _id: 0, name: 1 })
    .toArray();
  console.log(result);
  t.equal(3, result.length, 'count of documents should match expected');

  // Drop testing database
  await db.query.dropDatabase();
  db.close();
  t.end();
});

test('Basic server operations', async t => {
  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });
  // act
  const healthResponse = await GET(`http://127.0.0.1:${PORT}/health`);
  t.equal(healthResponse.statusCode, 200, '/health should return 200');
  t.deepEqual(
    healthResponse.body,
    { status: 'good' },
    '/health should return {status: good} in json format'
  );

  // act
  const faviconResponse = await requestPromise({
    uri: `http://127.0.0.1:${PORT}/favicon.ico`,
    resolveWithFullResponse: true
  });
  t.equal(faviconResponse.statusCode, 200, '/favicon.ico should return 200');
  t.deepEqual(
    faviconResponse.body,
    '',
    '/favicon.ico should return nothing but empty string'
  );

  // teardown
  server.shutdown();
  t.end();
});

test('End-points /restaurant basic operations', async t => {
  await createTestingDb();

  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });

  // CRUD: Read
  const readRestaurantsResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants`
  );
  t.equal(
    readRestaurantsResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants should return 200'
  );

  t.ok(
    ajv.validate(
      require('./schemas/restaurants/get/200.json'),
      readRestaurantsResponse.body
    ),
    '/restaurants should match its json-schema'
  );

  // CRUD: Create
  const newRestaurantName = `測試新建商店${new Date().getTime()}`;
  const createRestaurantResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurant`,
    { name: newRestaurantName }
  );
  t.equal(
    createRestaurantResponse.statusCode,
    HTTPStatus.CREATED,
    '/restaurants should return 201 if body is valid'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurant/post/201.json'),
      createRestaurantResponse.body
    ),
    '/restaurant response should match its json-schema when created'
  );

  const createRestaurantFailResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurant`,
    { illegalBody: `測試新建商店${new Date().getTime()}` }
  );
  t.equal(
    createRestaurantFailResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurants should return 400 if body is invalid'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurant/post/400.json'),
      createRestaurantFailResponse.body
    ),
    '/restaurant response should match its json-schema when creating fail'
  );

  // CRUD: Read
  const readRestaurantResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/${createRestaurantResponse.body.restaurantId}`
  );
  t.equal(
    readRestaurantResponse.statusCode,
    HTTPStatus.OK,
    '/restaurant/<restaurantId> should return 200 if resource exist'
  );
  t.equal(
    readRestaurantResponse.body.name,
    newRestaurantName,
    '/restaurant/<restaurantId> should return response which matches the same name just created'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurant/get/200.json'),
      readRestaurantResponse.body
    ),
    '/restaurant response should match its json-schema'
  );

  const readRestaurantNotFoundResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/ILLEGAL_ID`
  );
  t.equal(
    readRestaurantNotFoundResponse.statusCode,
    HTTPStatus.NOT_FOUND,
    '/restaurants should return 404 if resource is not found'
  );

  // CRUD: Update
  const updatedRestaurantName = `測試更新商店${new Date().getTime()}`;
  const updateRestaurantResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurant/${createRestaurantResponse.body.restaurantId}`,
    { name: updatedRestaurantName }
  );
  t.equal(
    updateRestaurantResponse.statusCode,
    HTTPStatus.OK,
    '/restaurant should return 200 if resource was updated'
  );

  const readUpdatedRestaurantResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/${createRestaurantResponse.body.restaurantId}`
  );
  t.equal(
    readUpdatedRestaurantResponse.body.name,
    updatedRestaurantName,
    '/restaurant/<restaurantId> should return response which matches the same name just updated'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurant/get/200.json'),
      readUpdatedRestaurantResponse.body
    ),
    '/restaurant response just updated should match json-schema'
  );

  const updateWithWrongTypeResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurant/${createRestaurantResponse.body.restaurantId}`,
    { name: 5566 }
  );
  t.equal(
    updateWithWrongTypeResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurant should return 400 if given value type were wrong'
  );
  console.log(updateWithWrongTypeResponse.body);

  const updateWithGivenFieldsWereNotAcceptedResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurant/${createRestaurantResponse.body.restaurantId}`,
    { fieldDoesntExisted: 'fakedata' }
  );
  t.equal(
    updateWithGivenFieldsWereNotAcceptedResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurant should return 400 if given fields were not accepted'
  );
  console.log(updateWithGivenFieldsWereNotAcceptedResponse.body);

  // teardown
  server.shutdown();
  await dropTestingDb();
  t.end();
});

test('End-points /restaurant/<restaurantId>/dish basic operations', async t => {
  await createTestingDb();

  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });

  const createRestaurantResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurant`,
    {
      name: '測試小吃店',
      location: {
        alias: '公司大門口對面',
        address: '測試路成功巷200號',
        coordinates: {
          lat: 25.0561558,
          lng: 121.6120222
        }
      },
      contact: {
        phone: '02-5566-778'
      },
      priceRange: {
        from: 99,
        to: 399
      },
      menu: [
        {
          name: '綜合海鮮粥',
          price: 120,
          tags: ['粥類', '海鮮']
        },
        {
          name: '泡菜綜合海鮮粥',
          price: 130,
          tags: ['粥類', '海鮮']
        },
        {
          name: '無刺魚肚粥',
          price: 120,
          tags: ['粥類', '海鮮']
        },
        {
          name: '鮮蚵粥',
          price: 70,
          tags: ['粥類', '海鮮']
        },
        {
          name: '香菇肉粥',
          price: 55,
          tags: ['粥類']
        },
        {
          name: '綜合海鮮麵',
          price: 120,
          tags: ['麵類', '海鮮']
        },
        {
          name: '泡菜綜合海鮮麵',
          price: 120,
          tags: ['麵類', '海鮮']
        },
        {
          name: '客家鹹湯圓',
          price: 55,
          tags: []
        },
        {
          name: '泡菜五花肉飯',
          price: 90,
          tags: ['飯類']
        },
        {
          name: '控肉便當',
          price: 75,
          tags: ['飯類', '豬肉']
        },
        {
          name: '雞腿便當',
          price: 75,
          tags: ['飯類', '雞肉']
        },
        {
          name: '台南米糕便當',
          price: 70,
          tags: ['飯類']
        },
        {
          name: '魚鬆肉燥便當',
          price: 70,
          tags: ['飯類']
        },
        {
          name: '台南米糕',
          price: 35,
          tags: ['飯類']
        },
        {
          name: '魚鬆肉燥飯',
          price: 30,
          tags: ['飯類']
        },
        {
          name: '無刺魚肚湯',
          price: 110,
          tags: ['湯類', '海鮮']
        },
        {
          name: '蚵仔湯',
          price: 55,
          tags: ['湯類', '海鮮']
        },
        {
          name: '蛤仔湯',
          price: 50,
          tags: ['湯類', '海鮮']
        },
        {
          name: '虱目魚丸湯',
          price: 30,
          tags: ['湯類', '海鮮']
        }
      ]
    }
  );

  const tempRestaurantId = createRestaurantResponse.body.restaurantId;

  // CRUD: Read
  const readDishesResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/${tempRestaurantId}/dishes`
  );
  t.equal(
    readDishesResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dishes should return 200'
  );
  t.ok(
    ajv.validate(
      require('./schemas/dishes/get/200.json'),
      readDishesResponse.body
    ),
    '/restaurants/<id>/dishes should match its json-schema'
  );

  const readDishesThatDoesntExistesResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/ILLEGAL_ID/dishes`
  );
  t.equal(
    readDishesThatDoesntExistesResponse.statusCode,
    HTTPStatus.NOT_FOUND,
    '/restaurants/<id>/dishes should return 404'
  );

  // CRUD: Create
  // const createDishResponse = await POST(
  //   `http://127.0.0.1:${PORT}/restaurant/${tempRestaurantId}/dish`
  // );

  const firstDishId = readDishesResponse.body.shift()._id;

  // CRUD: Create
  const createDishResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurant/${tempRestaurantId}/dish`,
    {
      name: '綜合測試粥',
      price: 100,
      tags: ['粥類', '測試']
    }
  );
  t.equal(
    createDishResponse.statusCode,
    HTTPStatus.CREATED,
    '/restaurants/<id>/dish should return 201 when dish was created'
  );
  const readFromDishJustCreatedResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/${tempRestaurantId}/dish/${createDishResponse.body.dishId}`
  );
  t.equal(
    readFromDishJustCreatedResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dish/<id> should return 200'
  );
  t.ok(
    ajv.validate(require('./schemas/dish/get/200.json'), readFromDishJustCreatedResponse.body),
    '/restaurants/<id>/dish/<id> should match its json-schema'
  );

  // CRUD: Read
  const readDishResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/${tempRestaurantId}/dish/${firstDishId}`
  );
  t.equal(
    readDishResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dish/<id> should return 200'
  );
  t.ok(
    ajv.validate(require('./schemas/dish/get/200.json'), readDishResponse.body),
    '/restaurants/<id>/dish/<id> should match its json-schema'
  );

  // teardown
  server.shutdown();
  await dropTestingDb();
  t.end();
});
