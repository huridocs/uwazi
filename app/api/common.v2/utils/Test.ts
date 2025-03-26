export class TestUtils {
  static arrayContaining(array: any, items: any[]) {
    expect(array).toEqual(expect.arrayContaining(items.map(i => expect.objectContaining(i))));
  }

  static mockClass<T>(aClass: Partial<T>) {
    return { ...aClass } as any as T;
  }
}
