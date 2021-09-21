import winston from 'winston';
import GrayLogTransport from './GrayLogTransport';
import { formatter } from './infoFormat';

let DATABASE_NAME = 'localhost';
let LOGS_DIR = './log';

interface ExtendedLogger extends winston.Logger {
  closeGraylog?: () => void;
}

const createFileTransport = () =>
  new winston.transports.File({
    filename: `${LOGS_DIR}/error.log`,
    handleExceptions: true,
    level: 'error',
    format: formatter(DATABASE_NAME),
  });

const createConsoleTransport = () =>
  new winston.transports.Console({
    handleExceptions: true,
    level: 'error',
    format: formatter(DATABASE_NAME),
  });

const createErrorLog = () => {
  DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
  LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : './log';

  const logger: ExtendedLogger = winston.createLogger({
    transports: [createFileTransport(), createConsoleTransport()],
  });

  logger.closeGraylog = (cb = () => {}) => {
    cb();
  };

  if (process.env.USE_GRAYLOG) {
    const graylogTransport = new GrayLogTransport({
      format: formatter(DATABASE_NAME),
      instance_name: DATABASE_NAME,
      server: process.env.USE_GRAYLOG,
    });
    //@ts-ignore
    logger.add(graylogTransport);
    logger.closeGraylog = graylogTransport.graylog.close.bind(graylogTransport.graylog);
  }

  return logger;
};

const errorLog = createErrorLog();

export { errorLog, createErrorLog };
