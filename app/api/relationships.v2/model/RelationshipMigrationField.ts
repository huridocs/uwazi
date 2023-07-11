/* eslint-disable max-classes-per-file */
class RelationShipMigrationFieldUniqueId {
  readonly sourceTemplate: string;

  readonly relationType: string;

  readonly targetTemplate: string;

  constructor(sourceTemplate: string, relationType: string, targetTemplate: string) {
    this.sourceTemplate = sourceTemplate;
    this.relationType = relationType;
    this.targetTemplate = targetTemplate;
  }
}

class RelationshipMigrationFieldInfo extends RelationShipMigrationFieldUniqueId {
  readonly ignored: boolean = false;

  constructor(
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string,
    ignored: boolean = false
  ) {
    super(sourceTemplate, relationType, targetTemplate);
    this.ignored = ignored;
  }
}

class RelationshipMigrationField extends RelationshipMigrationFieldInfo {
  readonly id: string;

  constructor(
    id: string,
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string,
    ignored: boolean = false
  ) {
    super(sourceTemplate, relationType, targetTemplate, ignored);
    this.id = id;
  }
}

export {
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
  RelationShipMigrationFieldUniqueId,
};
