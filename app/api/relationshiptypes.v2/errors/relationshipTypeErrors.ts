/* eslint-disable max-classes-per-file */
class RelationshipTypeError extends Error {}

class MissingRelationshipTypeError extends RelationshipTypeError {}

export { RelationshipTypeError, MissingRelationshipTypeError };
