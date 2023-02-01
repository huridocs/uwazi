import model from 'api/activitylog/activitylogModel';
import logger from '../logger';

describe('Migrations ActivityLog logger', () => {
  it('should create a new fieldParseError log', () => {
    jest.spyOn(model, 'save').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValue(0);

    logger.logFieldParseError(
      {
        template: 'template',
        sharedId: 'sharedId',
        title: 'title',
        propertyName: 'propertyName',
        value: 'value',
      },
      'migration-name'
    );

    expect(model.save).toHaveBeenCalledWith({
      url: '',
      method: 'MIGRATE',
      params: '',
      query: '',
      body: JSON.stringify({
        type: 'fieldParseError',
        migrationName: 'migration-name',
        template: 'template',
        sharedId: 'sharedId',
        title: 'title',
        propertyName: 'propertyName',
        value: 'value',
      }),
      user: null,
      username: 'System',
      time: 0,
    });
  });
});
