export class TestUtils {
  static mockClass<T>(aClass: Partial<T>) {
    return { ...aClass } as any as T;
  }

  static arrayIncludesObjects(items: Record<string, any>[]) {
    return expect.arrayContaining(items.map(item => expect.objectContaining(item)));
  }
}
