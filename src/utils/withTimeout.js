// A deadline ends the UI wait; it does not cancel the underlying Firebase read.
export function withTimeout(promise, milliseconds = 10000) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('The connection timed out. Check your connection and retry.');
      error.code = 'unavailable';
      reject(error);
    }, milliseconds);
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}
