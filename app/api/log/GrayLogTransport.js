import graylog2 from 'graylog2';
import winston from 'winston';
import formatMessage from './formatMessage';

export default class GrayLogTransport extends winston.Transport {
  constructor(opts) {
    super(opts);

    this.instanceName = opts.instance_name;
    // eslint-disable-next-line new-cap
    this.graylog = new graylog2.graylog({
      servers: [{ host: opts.server, port: 12201 }],
      hostname: this.instanceName,
      facility: 'Uwazi instances',
    });

    this.graylog.on('error', error => {
      console.error('Error while trying to write to graylog2:', error); //eslint-disable-line no-console
    });
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.graylog.log(formatMessage(info, this.instanceName));
    callback();
  }
}
