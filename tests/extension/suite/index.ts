import * as path from 'path';

export function run(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Run the test suite
      const extensionTest = require('./extension.test');
      if (typeof extensionTest.runAll === 'function') {
        extensionTest.runAll().then(resolve).catch(reject);
      } else {
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
}
