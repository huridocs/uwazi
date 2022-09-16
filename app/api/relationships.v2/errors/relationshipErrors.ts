/* eslint-disable max-classes-per-file */
class RelationshipError extends Error {}

class MissingRelationshipError extends RelationshipError {}

class MissingRelationshipTypeError extends RelationshipError {}

class SelfReferenceError extends RelationshipError {}

class MissingEntityError extends RelationshipError {}

export {
  MissingRelationshipError,
  MissingRelationshipTypeError,
  SelfReferenceError,
  MissingEntityError,
};
