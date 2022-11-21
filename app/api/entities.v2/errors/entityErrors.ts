/* eslint-disable max-classes-per-file */
class EntityError extends Error {}

class MissingEntityError extends EntityError {}

export { EntityError, MissingEntityError };
