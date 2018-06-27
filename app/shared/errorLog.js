import winston from 'winston';
import graylog2 from 'graylog2';

const DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
const LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : `${__dirname}/../../log`;

const formatMessage = (info) => {
  const message = (typeof info.message === 'object')
    ? info.message.join('\n') : info.message;

  const result = `${info.timestamp} [${DATABASE_NAME}] ${message}`;

  return result;
};

const formatter = winston.format.printf(info => formatMessage(info));

const errorLogger = winston.createLogger({
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
      handleExceptions: true,
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        formatter
      )
    })
  ]
});

const graylog = new graylog2.graylog({ //eslint-disable-line new-cap
  servers: [
        { host: process.env.USE_GRAYLOG, port: 12201 }
  ],
  hostname: DATABASE_NAME,
  facility: 'Uwazi instances'
});

graylog.on('error', (error) => {
  console.error('Error while trying to write to graylog2:', error); //eslint-disable-line no-console
});

class GrayLogTransport extends winston.Transport {
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    graylog.log(formatMessage(info));
    callback();
  }
}

if (process.env.USE_GRAYLOG) {
  errorLogger.add(new GrayLogTransport({
    format: winston.format.combine(
      winston.format.timestamp(),
      formatter
    )
  }));
}

export default errorLogger;
