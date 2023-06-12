// eslint-disable-next-line max-classes-per-file
class V1Connection {
  readonly id: string;

  readonly entity: string;

  readonly hub: string;

  readonly template?: string;

  constructor(id: string, entity: string, hub: string, template: string | undefined) {
    this.id = id;
    this.entity = entity;
    this.hub = hub;
    this.template = template;
  }
}

class V1ConnectionDisplayed extends V1Connection {
  readonly entityTemplate: string;

  readonly entityTitle: string;

  readonly templateName: string;

  constructor(
    id: string,
    entity: string,
    hub: string,
    template: string | undefined,
    entityTemplate: string,
    entityTitle: string,
    templateName: string
  ) {
    super(id, entity, hub, template);
    this.entityTemplate = entityTemplate;
    this.entityTitle = entityTitle;
    this.templateName = templateName;
  }
}

export { V1Connection, V1ConnectionDisplayed };
