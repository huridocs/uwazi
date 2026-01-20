const syncedPromiseLoop = async <T>(
  arr: T[],
  promiseFunc: (curr: T, index: number) => Promise<boolean | void>
): Promise<void> => {
  let index = 0;
  let continueLoop = true;
  while (index < arr.length && continueLoop) {
    // eslint-disable-next-line no-await-in-loop
    continueLoop = (await promiseFunc(arr[index], index)) !== false;
    index += 1;
  }
};

export { syncedPromiseLoop };
