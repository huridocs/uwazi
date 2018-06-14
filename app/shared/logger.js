import winston from 'winston';

const logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({
      filename: './log/debug.log',
      prettyPrint: false,
      json: false,
      handleExceptions: true,
      level: 'debug'
    })
  ]
});

export default logger;
