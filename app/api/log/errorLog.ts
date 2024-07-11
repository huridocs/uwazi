import { formatter } from './infoFormat';

const createErrorLog = (logger: (message: string) => void) => {
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
  };
};

const defaultLogger = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(message);
};

const silentLogger = () => {};

const errorLog = createErrorLog(process.env.NODE_ENV === 'test' ? silentLogger : defaultLogger);

export { createErrorLog, errorLog };
