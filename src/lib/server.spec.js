require('babel-polyfill');

import test from 'tape';
import Server from './server';
import requestPromise from 'request-promise';

test('Basic server operation', async t => {
  t.plan(1);
  // arrange
  const s = new Server();
  s.boot();
  // assert
  const expected = { status: 'good' };
  // act
  const response = await requestPromise({
    uri: 'http://127.0.0.1:3002/health',
    json: true
  });
  t.deepEqual(response, expected, '/health should be good');
  // teardown
  s.shutdown();
});
