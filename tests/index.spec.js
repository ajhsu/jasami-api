import test from 'tape';

test('Basic', t => {
  t.plan(1);
  t.deepEqual(1 + 1, 2, '1 + 1 === 2');
});