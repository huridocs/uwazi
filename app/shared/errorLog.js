import winston from 'winston';

const DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
const LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : `${__dirname}/../../log`;

const formatter = winston.format.printf((info) => {
  const message = (typeof info.message === 'object')
    ? info.message.join('\n') : info.message;

  return `${info.timestamp} [${DATABASE_NAME}] ${message}`;
});

export default winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: `${LOGS_DIR}/error.log`,
      handleExceptions: true,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        formatter
      )
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        formatter
      )
    })
  ]
});
