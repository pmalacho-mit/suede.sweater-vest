// Helpers a test imports as a type, and a generated test as a value.
// This module never reaches a build: the components only `import type` it.

/** A promise the test settles when it decides to. */
export const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
