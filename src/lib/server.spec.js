require('babel-polyfill');

import test from 'tape';
import Server from './server';
import requestPromise from 'request-promise';

test('Basic server operation', async t => {
  // arrange
  const server = new Server();
  server.boot();

  // act
  const healthResponse = await requestPromise({
    uri: 'http://127.0.0.1:3002/health',
    resolveWithFullResponse: true,
    json: true
  });
  t.equal(
    healthResponse.statusCode,
    200,
    '/health should return 200'
  );
  t.deepEqual(
    healthResponse.body,
    { status: 'good' },
    '/health should return {status: good} in json format'
  );

  // act
  const faviconResponse = await requestPromise({
    uri: 'http://127.0.0.1:3002/favicon.ico',
    resolveWithFullResponse: true
  });
  t.equal(
    faviconResponse.statusCode,
    200,
    '/favicon.ico should return 200'
  );
  t.deepEqual(
    faviconResponse.body,
    '',
    '/favicon.ico should return nothing but empty string'
  );
  
  // teardown
  server.shutdown();
  t.end();
});
