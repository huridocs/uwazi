const objectId = '[0-9a-fA-F]{24}';

const ObjectIdAsString = {
  type: 'string',
  pattern: `^${objectId}$`,
};

const ObjectIdListAsString = {
  type: 'string',
  pattern: `^${objectId}(,${objectId})*$`,
};

export { ObjectIdAsString, ObjectIdListAsString };
