/* eslint-disable max-classes-per-file */
class RelationShipMigrationFieldUniqueId {
  readonly sourceTemplate: string;

  readonly relationType: string;

  readonly targetTemplate?: string;

  constructor(sourceTemplate: string, relationType: string, targetTemplate?: string) {
    this.sourceTemplate = sourceTemplate;
    this.relationType = relationType;
    this.targetTemplate = targetTemplate === '' ? undefined : targetTemplate;
  }
}

class RelationshipMigrationFieldInfo extends RelationShipMigrationFieldUniqueId {
  readonly ignored: boolean = false;

  readonly infered: boolean = false;

  constructor(
    sourceTemplate: string,
    relationType: string,
    targetTemplate?: string,
    ignored: boolean = false,
    infered: boolean = false
  ) {
    super(sourceTemplate, relationType, targetTemplate);
    this.ignored = ignored;
    this.infered = infered;
  }

  getId() {
    return new RelationShipMigrationFieldUniqueId(
      this.sourceTemplate,
      this.relationType,
      this.targetTemplate
    );
  }
}

class RelationshipMigrationField extends RelationshipMigrationFieldInfo {
  readonly id: string;

  constructor(
    id: string,
    sourceTemplate: string,
    relationType: string,
    targetTemplate?: string,
    ignored: boolean = false
  ) {
    super(sourceTemplate, relationType, targetTemplate, ignored);
    this.id = id;
  }

  getInfo() {
    return new RelationshipMigrationFieldInfo(
      this.sourceTemplate,
      this.relationType,
      this.targetTemplate,
      this.ignored
    );
  }
}

export {
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
  RelationShipMigrationFieldUniqueId,
};
