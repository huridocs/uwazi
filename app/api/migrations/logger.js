import model from 'api/activitylog/activitylogModel';

export const logTypes = {
  FIELD_PARSE_ERROR: 'fieldParseError',
};

function log(body) {
  const time = Date.now();
  const entry = {
    url: '',
    method: 'MIGRATE',
    params: '',
    query: '',
    body: JSON.stringify(body),
    user: null,
    username: 'System',
    time,
  };
  model.save(entry);
}

function logFieldParseError(
  { template, sharedId, title, propertyName, value },
  migrationName = 'unknown migration'
) {
  log({
    type: logTypes.FIELD_PARSE_ERROR,
    migrationName,
    template,
    sharedId,
    title,
    propertyName,
    value,
  });
}

export default {
  logFieldParseError,
};
