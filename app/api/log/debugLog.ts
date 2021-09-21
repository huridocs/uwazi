import winston from 'winston';
import { formatter } from './infoFormat';

let DATABASE_NAME = 'localhost';
let LOGS_DIR = './log';

const createDebugLog = () => {
  DATABASE_NAME = process.env.DATABASE_NAME || DATABASE_NAME;
  LOGS_DIR = process.env.LOGS_DIR || LOGS_DIR;

  return winston.createLogger({
    transports: [
      new winston.transports.File({
        filename: `${LOGS_DIR}/debug.log`,
        level: 'debug',
        format: formatter(DATABASE_NAME),
      }),
    ],
  });
};

const debugLog = createDebugLog();

export { debugLog, createDebugLog };
