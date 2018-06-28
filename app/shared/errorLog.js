import winston from 'winston';
import graylog2 from 'graylog2';

let DATABASE_NAME = 'localhost';
let LOGS_DIR = `${__dirname}/../../log`;

const formatMessage = (info) => {
  const message = (typeof info.message === 'object')
    ? info.message.join('\n') : info.message;

  const result = `${info.timestamp} [${DATABASE_NAME}] ${message}`;

  return result;
};

const formatter = winston.format.printf(info => formatMessage(info));

class GrayLogTransport extends winston.Transport {
  constructor(opts) {
    super(opts);

    this.graylog = new graylog2.graylog({ //eslint-disable-line new-cap
      servers: [
            { host: opts.server, port: 12201 }
      ],
      hostname: DATABASE_NAME,
      facility: 'Uwazi instances'
    });

    this.graylog.on('error', (error) => {
      console.error('Error while trying to write to graylog2:', error); //eslint-disable-line no-console
    });
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.graylog.log(formatMessage(info));
    callback();
  }
}

export const createErrorLog = () => {
  DATABASE_NAME = process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'localhost';
  LOGS_DIR = process.env.LOGS_DIR ? process.env.LOGS_DIR : `${__dirname}/../../log`;

  const logger = winston.createLogger({
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

  if (process.env.USE_GRAYLOG) {
    logger.add(new GrayLogTransport({
      format: winston.format.combine(
        winston.format.timestamp(),
        formatter
      ),
      server: process.env.USE_GRAYLOG
    }));
  }

  return logger;
};

export default createErrorLog();
