import test from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../src/utils/withTimeout.js';
test('stalled reads stop waiting with a retryable unavailable error', async () => {
  await assert.rejects(withTimeout(new Promise(()=>{}), 15), {code:'unavailable'});
});
test('successful reads resolve immediately and retain their result', async () => {
  assert.equal(await withTimeout(Promise.resolve('cached profile'),1000),'cached profile');
});
test('permission errors are preserved rather than treated as a missing profile', async () => {
  const error=Object.assign(new Error('Denied'),{code:'permission-denied'});
  await assert.rejects(withTimeout(Promise.reject(error)), value=>value===error);
});
