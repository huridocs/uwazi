class V1Connection {
  readonly id: string;

  readonly entity: string;

  readonly hub: string;

  readonly template: string;

  readonly entityTemplate?: string;

  constructor(id: string, entity: string, hub: string, template: string, entityTemplate?: string) {
    this.id = id;
    this.entity = entity;
    this.hub = hub;
    this.template = template;
    this.entityTemplate = entityTemplate;
  }
}

export { V1Connection };
