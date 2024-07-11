import { formatter } from './infoFormat';

const createDebugLog = (logger: (message: string) => void) => {
  const DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
  return {
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

const debugLog = createDebugLog(process.env.NODE_ENV === 'test' ? silentLogger : defaultLogger);

export { debugLog, createDebugLog };
