import winston from 'winston';

const LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : './log';

export default winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: `${LOGS_DIR}/debug.log`,
      json: false,
      level: 'debug',
    }),
  ],
});
