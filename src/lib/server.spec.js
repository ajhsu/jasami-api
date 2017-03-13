require('babel-polyfill');

import test from 'tape';
import Ajv from 'ajv';
// JSON-Schema validator
const ajv = new Ajv();
import Server from './server';
import requestPromise from 'request-promise';
import HTTPStatus from 'http-status';
import db from './database';
import { GET, POST, PUT } from './utils/restful-test';

// MongoDB Driver
const mongo = require('mongodb').MongoClient;
const mongoConfig = {
  address: 'localhost',
  port: 27017,
  dbName: 'jasami_test_db'
};

const createTestingDb = async () => {
  db.init(mongoConfig);
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  // Create collection
  await db.query.createCollection('restaurants');
  await db.query.collection('restaurants').insert(require('./mock-db.js'));
  db.close();
};

const dropTestingDb = async () => {
  db.init(mongoConfig);
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  db.close();
};

test('Connect to MongoDB', async t => {
  db.init(mongoConfig);
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

test('Basic server operation', async t => {
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

test('Basic End-points operation', async t => {
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
