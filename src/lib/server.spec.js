import test from 'tape';
import Server from './server';

test('Basic server operation', t => {
  t.plan(1);
  t.ok(1 == 1, 'one equals to one');
});
