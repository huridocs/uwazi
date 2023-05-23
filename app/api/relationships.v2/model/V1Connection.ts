class V1Connection {
  readonly entity: string;

  readonly hub: string;

  readonly template: string;

  constructor(entity: string, hub: string, template: string) {
    this.entity = entity;
    this.hub = hub;
    this.template = template;
  }
}

export { V1Connection };
