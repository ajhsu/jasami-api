require('babel-polyfill');

import test from 'tape';
import Server from './server';
import requestPromise from 'request-promise';

test('Basic server operation', async t => {
  // arrange
  const server = new Server();
  server.boot();
  // act
  const response = await requestPromise({
    uri: 'http://127.0.0.1:3002/health',
    resolveWithFullResponse: true,
    json: true
  });
  t.equal(response.statusCode, 200, '/health should return 200');
  t.deepEqual(
    response.body,
    { status: 'good' },
    '/health should return {status: good} in json format'
  );
  // teardown
  server.shutdown();
  t.end();
});
