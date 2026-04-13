export class TestUtils {
  static mockClass<T>(aClass: Partial<T>) {
    return { ...aClass } as any as T;
  }

  static arrayIncludesObjects(items: Record<string, any>[]) {
    return (expect as any).arrayContaining(
      items.map((item: any) => (expect as any).objectContaining(item))
    );
  }
}
