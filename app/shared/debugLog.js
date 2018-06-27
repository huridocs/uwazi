import winston from 'winston';

export default winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: './log/debug.log',
      json: false,
      level: 'debug'
    })
  ]
});
