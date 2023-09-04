const sequentialPromises = async <T>(
  items: T[],
  asyncCallback: (element: T, index: number, originalArray: T[]) => Promise<void>
): Promise<void> => {
  const wrappedCallback = async (
    previousPromise: Promise<void>,
    element: T,
    index: number,
    originalArray: T[]
  ) => {
    await previousPromise;
    await asyncCallback(element, index, originalArray);
  };
  await items.reduce(wrappedCallback, Promise.resolve());
};

export { sequentialPromises };
