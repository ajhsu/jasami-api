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
import { GET, POST, PUT } from './utils/restful-request';
import {
  createTestingDb,
  dropTestingDb,
  createCounterCollection,
  dropCounterCollection,
  getNextCount
} from './utils/database-migration';

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
  await db.close();
  t.end();
});

test('Basic server operations', async t => {
  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });
  // act
  const routeTableResponse = await GET(`http://127.0.0.1:${PORT}/`);
  t.equal(routeTableResponse.statusCode, 200, '/ should return 200');
  console.log(routeTableResponse.body);

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
  await server.shutdown();
  t.end();
});

test('End-points /restaurant basic operations', async t => {
  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });
  await createTestingDb();

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
    `http://127.0.0.1:${PORT}/restaurants`,
    { name: newRestaurantName }
  );
  t.equal(
    createRestaurantResponse.statusCode,
    HTTPStatus.CREATED,
    '/restaurants should return 201 if body is valid'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurants/resource/post/201.json'),
      createRestaurantResponse.body
    ),
    '/restaurant response should match its json-schema when created'
  );

  const createRestaurantFailResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurants`,
    { illegalBody: `測試新建商店${new Date().getTime()}` }
  );
  t.equal(
    createRestaurantFailResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurants should return 400 if body is invalid'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurants/resource/post/400.json'),
      createRestaurantFailResponse.body
    ),
    '/restaurant response should match its json-schema when creating fail'
  );

  // CRUD: Read
  const readRestaurantResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`
  );
  t.equal(
    readRestaurantResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<restaurantId> should return 200 if resource exist'
  );
  t.equal(
    readRestaurantResponse.body.name,
    newRestaurantName,
    '/restaurants/<restaurantId> should return response which matches the same name just created'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurants/resource/get/200.json'),
      readRestaurantResponse.body
    ),
    '/restaurant response should match its json-schema'
  );

  const readRestaurantNotFoundResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants/ILLEGAL_ID`
  );
  t.equal(
    readRestaurantNotFoundResponse.statusCode,
    HTTPStatus.NOT_FOUND,
    '/restaurants should return 404 if resource is not found'
  );

  // CRUD: Update
  const updatedRestaurantName = `測試更新商店${new Date().getTime()}`;
  const updateRestaurantResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`,
    { name: updatedRestaurantName }
  );
  t.equal(
    updateRestaurantResponse.statusCode,
    HTTPStatus.OK,
    '/restaurant should return 200 if resource was updated'
  );

  const readUpdatedRestaurantResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`
  );
  t.equal(
    readUpdatedRestaurantResponse.body.name,
    updatedRestaurantName,
    '/restaurants/<restaurantId> should return response which matches the same name just updated'
  );
  t.ok(
    ajv.validate(
      require('./schemas/restaurants/resource/get/200.json'),
      readUpdatedRestaurantResponse.body
    ),
    '/restaurant response just updated should match json-schema'
  );

  const updateWithWrongTypeResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`,
    { name: 5566 }
  );
  t.equal(
    updateWithWrongTypeResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurant should return 400 if given value type were wrong'
  );

  const updateWithGivenFieldsWereNotAcceptedResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`,
    { fieldDoesntExisted: 'fakedata' }
  );
  t.equal(
    updateWithGivenFieldsWereNotAcceptedResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurant should return 400 if given fields were not accepted'
  );

  const updateWithEmptyBodyResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${createRestaurantResponse.body.restaurantId}`
  );
  t.equal(
    updateWithEmptyBodyResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurant should return 400 if request body is empty'
  );

  // teardown
  await dropTestingDb();
  await server.shutdown();
  t.end();
});

test('End-points /restaurants/<restaurantId>/dish basic operations', async t => {
  // arrange
  const PORT = 3001;
  const server = new Server();
  await server.boot({ port: PORT });
  await createTestingDb();

  const createRestaurantResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurants`,
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
        }
      ]
    }
  );

  const tempRestaurantId = createRestaurantResponse.body.restaurantId;

  // CRUD: Read
  const readDishesResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes`
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
    `http://127.0.0.1:${PORT}/restaurants/ILLEGAL_ID/dishes`
  );
  t.equal(
    readDishesThatDoesntExistesResponse.statusCode,
    HTTPStatus.NOT_FOUND,
    '/restaurants/<id>/dishes should return 404'
  );

  // CRUD: Create
  // const createDishResponse = await POST(
  //   `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes`
  // );

  const firstDishId = readDishesResponse.body.shift()._id;

  // CRUD: Create
  const createDishResponse = await POST(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes`,
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
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${createDishResponse.body.dishId}`
  );
  t.equal(
    readFromDishJustCreatedResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dishes/<id> should return 200'
  );
  t.ok(
    ajv.validate(
      require('./schemas/dishes/resource/get/200.json'),
      readFromDishJustCreatedResponse.body
    ),
    '/restaurants/<id>/dishes/<id> should match its json-schema'
  );

  // CRUD: Read
  const readDishResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${firstDishId}`
  );
  t.equal(
    readDishResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dishes/<id> should return 200'
  );
  t.ok(
    ajv.validate(require('./schemas/dishes/resource/get/200.json'), readDishResponse.body),
    '/restaurants/<id>/dishes/<id> should match its json-schema'
  );

  // CRUD: Update
  const updateDishWithCorrectPropertiesResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${createDishResponse.body.dishId}`,
    { name: '綜合測試更新粥', price: 99 }
  );
  t.equal(
    updateDishWithCorrectPropertiesResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants/<id>/dishes/<id> should return 200 when updated success'
  );

  const updateDishWithWrongTypedPropertyResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${createDishResponse.body.dishId}`,
    { name: '綜合測試錯誤粥', price: '給一個錯誤的型別' }
  );
  t.equal(
    updateDishWithWrongTypedPropertyResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurants/<id>/dishes/<id> should return 400 when updated with wrong-typed property'
  );

  const updateDishWithUnrelatedPropertyResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${createDishResponse.body.dishId}`,
    { unrelatedProperty: '給定一個無關的屬性' }
  );
  t.equal(
    updateDishWithUnrelatedPropertyResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurants/<id>/dishes/<id> should return 400 when updated with unrelated property'
  );

  const updateWithEmptyBodyResponse = await PUT(
    `http://127.0.0.1:${PORT}/restaurants/${tempRestaurantId}/dishes/${firstDishId}`,
  );
  t.equal(
    updateWithEmptyBodyResponse.statusCode,
    HTTPStatus.BAD_REQUEST,
    '/restaurants/<id>/dishes/<id> should return 400 if request body is empty'
  );

  // teardown
  await dropTestingDb();
  await server.shutdown();
  t.end();
});
