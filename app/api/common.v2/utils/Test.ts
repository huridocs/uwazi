export class TestUtils {
  static mockClass<T>(aClass: Partial<T>) {
    return { ...aClass } as any as T;
  }
}
