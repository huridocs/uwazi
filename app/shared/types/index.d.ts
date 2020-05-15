export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toNeedAuthorization(): R;
    }
  }
}
