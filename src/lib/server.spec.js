require('babel-polyfill');

import test from 'tape';
import Ajv from 'ajv';
import Server from './server';
import requestPromise from 'request-promise';

// JSON-Schema validator
const ajv = new Ajv();

// Wrapped method that makeing a GET request and return in Promise
const GET = url => {
  return requestPromise({
    uri: url,
    resolveWithFullResponse: true,
    json: true
  });
};

test('Basic server operation', async t => {
  // arrange
  const PORT = 3001;
  const server = new Server();
  server.boot({ port: PORT });

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
  // arrange
  const PORT = 3001;
  const server = new Server();
  server.boot({ port: PORT });

  // Endpoint: /restaurants
  const restaurantResponse = await GET(`http://127.0.0.1:${PORT}/restaurants`);
  t.equal(restaurantResponse.statusCode, 200, '/restaurants should return 200');

  // json-schema validate
  const valid = ajv.validate(
    require('./schemas/restaurants.json'),
    restaurantResponse.body
  );
  t.ok(valid, '/restaurants should match its json-schema');
  if (!valid) console.log(ajv.errors);

  // teardown
  server.shutdown();
  t.end();
});
