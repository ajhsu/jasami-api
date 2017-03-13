require('babel-polyfill');

import test from 'tape';
import Ajv from 'ajv';
import Server from './server';
import requestPromise from 'request-promise';
import HTTPStatus from 'http-status';
import db from './database';

// MongoDB Driver
const mongo = require('mongodb').MongoClient;
// JSON-Schema validator
const ajv = new Ajv();
// Wrapped method that makeing a GET request and return in Promise
const GET = url => {
  return requestPromise({
    uri: url,
    resolveWithFullResponse: true,
    // Disable auto rejection if is not 2xx
    simple: false,
    json: true
  });
};
const POST = (url, body = {}) => {
  return requestPromise({
    method: 'POST',
    uri: url,
    body: body,
    resolveWithFullResponse: true,
    // Disable auto rejection if is not 2xx
    simple: false,
    json: true
  });
};

const createTestingDb = async () => {
  db.init({
    address: 'localhost',
    port: 27017,
    dbName: 'jasami_test_db'
  });
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  // Create collection
  await db.query.createCollection('restaurants');
  await db.query.collection('restaurants').insert(require('./mock-db.js'));
  db.close();
};

const dropTestingDb = async () => {
  db.init({
    address: 'localhost',
    port: 27017,
    dbName: 'jasami_test_db'
  });
  await db.connect();
  // Drop previous database
  await db.query.dropDatabase();
  db.close();
};

test('Connect to MongoDB', async t => {
  db.init({
    address: 'localhost',
    port: 27017,
    dbName: 'jasami_test_db'
  });
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

  // Endpoint: /restaurants
  const readRestaurantsResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurants`
  );
  t.equal(
    readRestaurantsResponse.statusCode,
    HTTPStatus.OK,
    '/restaurants should return 200'
  );

  // json-schema validate
  t.ok(
    ajv.validate(
      require('./schemas/restaurants/get/200.json'),
      readRestaurantsResponse.body
    ),
    '/restaurants should match its json-schema'
  );

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
    '/restaurant/<restaurantId> should return response which matches the same name just given'
  );

  const readRestaurantNotFoundResponse = await GET(
    `http://127.0.0.1:${PORT}/restaurant/ILLEGAL_ID`
  );
  t.equal(
    readRestaurantNotFoundResponse.statusCode,
    HTTPStatus.NOT_FOUND,
    '/restaurants should return 404 if resource is not found'
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

  // teardown
  server.shutdown();
  await dropTestingDb();
  t.end();
});
