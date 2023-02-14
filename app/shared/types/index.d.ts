export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toNeedAuthorization(): R;
    }
  }

  interface Window {
    UWAZI_VERSION: string;
    UWAZI_ENVIRONMENT: string;
    SENTRY_APP_DSN: string;
  }
}
