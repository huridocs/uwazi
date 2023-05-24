class V1Connection {
  readonly entity: string;

  readonly hub: string;

  readonly template: string;

  readonly entityTemplate?: string;

  constructor(entity: string, hub: string, template: string, entityTemplate?: string) {
    this.entity = entity;
    this.hub = hub;
    this.template = template;
    this.entityTemplate = entityTemplate;
  }
}

export { V1Connection };
