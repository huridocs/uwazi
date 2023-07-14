/* eslint-disable max-classes-per-file */
class RelationShipMigrationFieldUniqueId {
  readonly sourceTemplate: string;

  readonly relationType: string;

  readonly targetTemplate?: string;

  readonly stringHash: string;

  constructor(sourceTemplate: string, relationType: string, targetTemplate?: string) {
    this.sourceTemplate = sourceTemplate;
    this.relationType = relationType;
    this.targetTemplate = targetTemplate === '' ? undefined : targetTemplate;
    this.stringHash = `${this.sourceTemplate}#${this.relationType}#${this.targetTemplate}`;
  }
}

class RelationshipMigrationField {
  public ignored: boolean = false;

  readonly id: RelationShipMigrationFieldUniqueId;

  readonly infered: boolean = false;

  constructor(
    id: RelationShipMigrationFieldUniqueId,
    ignored: boolean = false,
    infered: boolean = false
  ) {
    this.id = id;
    this.ignored = ignored;
    this.infered = infered;
  }

  flatten() {
    return {
      sourceTemplate: this.id.sourceTemplate,
      relationType: this.id.relationType,
      targetTemplate: this.id.targetTemplate,
      ignored: this.ignored,
      infered: this.infered,
    };
  }
}

export { RelationshipMigrationField, RelationShipMigrationFieldUniqueId };
