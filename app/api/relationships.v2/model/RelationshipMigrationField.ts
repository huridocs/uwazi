class RelationshipMigrationField {
  readonly id: string;

  readonly sourceTemplate: string;

  readonly relationType: string;

  readonly targetTemplate: string;

  readonly ignored: boolean = false;

  constructor(
    id: string,
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string,
    ignored: boolean = false
  ) {
    this.id = id;
    this.sourceTemplate = sourceTemplate;
    this.relationType = relationType;
    this.targetTemplate = targetTemplate;
    this.ignored = ignored;
  }
}

export { RelationshipMigrationField };
