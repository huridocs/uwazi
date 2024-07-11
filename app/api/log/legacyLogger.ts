import { formatter } from './infoFormat';

const createLegacyLogger = (logger: (message: string) => void) => {
  const DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';

  return {
    error(message: string) {
      logger(
        formatter({
          DATABASE_NAME,
          message,
          level: 'error',
        })
      );
    },
    debug(message: string) {
      logger(
        formatter({
          DATABASE_NAME,
          message,
          level: 'debug',
        })
      );
    },
  };
};

const defaultLogger = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(message);
};

const silentLogger = () => {};

const legacyLogger = createLegacyLogger(
  process.env.NODE_ENV === 'test' ? silentLogger : defaultLogger
);

export { createLegacyLogger, legacyLogger };
