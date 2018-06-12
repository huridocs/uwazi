import winston from 'winston';

const logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new winston.transports.File({
      filename: './log/debug.log',
      prettyPrint: true
    })
  ]
});

export default logger;
