/* eslint-disable max-classes-per-file */
class RelationshipError extends Error {}

class MissingRelationshipError extends RelationshipError {}

class SelfReferenceError extends RelationshipError {}

export { RelationshipError, MissingRelationshipError, SelfReferenceError };
