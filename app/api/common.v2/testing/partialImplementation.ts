export function partialImplementation<ImplementedInterface extends { [k: string | symbol]: any }>(
  implementation: Partial<ImplementedInterface>
) {
  return new Proxy(implementation, {
    get(obj, prop) {
      if (prop in obj) {
        return obj[prop];
      }
      throw new Error(`Member "${String(prop)}" is not defined in the mock`);
    },
  }) as ImplementedInterface;
}
