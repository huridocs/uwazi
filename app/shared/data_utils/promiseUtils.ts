const syncedPromiseLoop = async <T>(
  arr: T[],
  promiseFunc: (curr: T, index: number) => Promise<any>
): Promise<void> =>
  arr.reduce(
    async (lastPromise, curr, index) => lastPromise.then(async () => promiseFunc(curr, index)),
    Promise.resolve()
  );

export { syncedPromiseLoop };
