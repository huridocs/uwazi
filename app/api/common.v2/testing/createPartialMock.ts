export function createPartialMock<MockedInterface extends { [k: string | symbol]: any }>(
  partialImplementation: Partial<MockedInterface>
) {
  return new Proxy(partialImplementation, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop];
      }
      throw new Error(`Member "${String(prop)}" is not defined in the mock`);
    },
  }) as MockedInterface;
}
