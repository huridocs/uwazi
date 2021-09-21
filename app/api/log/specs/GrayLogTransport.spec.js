import { tenants } from 'api/tenants';
import GrayLogTransport from '../GrayLogTransport';

describe('GrayLogTransport', () => {
  it('should get instance name from opts and have a graylog2', () => {
    const aTransport = new GrayLogTransport({
      instance_name: 'some_name',
    });

    expect(aTransport.instanceName).toBe('some_name');
    expect(aTransport.graylog.constructor.name).toBe('graylog');
  });

  it('should pass log call to graylog2 instance', async () => {
    const aTransport = new GrayLogTransport({
      instance_name: 'some_name',
    });

    spyOn(aTransport.graylog, 'log');

    await tenants.run(async () => {
      aTransport.log({ message: 'message', timestamp: 'timestamp' }, () => {});
    });

    expect(aTransport.graylog.log).toHaveBeenCalledWith('timestamp [some_name] message');
  });
});
