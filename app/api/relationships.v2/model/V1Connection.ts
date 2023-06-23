// eslint-disable-next-line max-classes-per-file
class V1SelectionRectangle {
  readonly page: string;

  readonly top: number;

  readonly left: number;

  readonly height: number;

  readonly width: number;

  constructor(page: string, top: number, left: number, height: number, width: number) {
    this.page = page;
    this.top = top;
    this.left = left;
    this.height = height;
    this.width = width;
  }
}

class V1TextReference {
  readonly text: string;

  readonly selectionRectangles: V1SelectionRectangle[];

  constructor(text: string, selectionRectangles: V1SelectionRectangle[]) {
    this.text = text;
    this.selectionRectangles = selectionRectangles;
  }
}

class V1Connection {
  readonly id: string;

  readonly entity: string;

  readonly hub: string;

  readonly template?: string;

  readonly file?: string;

  readonly reference?: V1TextReference;

  constructor(
    id: string,
    entity: string,
    hub: string,
    template: string | undefined,
    file?: string,
    reference?: V1TextReference
  ) {
    this.id = id;
    this.entity = entity;
    this.hub = hub;
    this.template = template;
    if ((file && !reference) || (!file && reference)) {
      throw new Error('File and reference should be both defined or undefined');
    }
    this.file = file;
    this.reference = reference;
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
    templateName: string,
    file?: string,
    reference?: V1TextReference
  ) {
    super(id, entity, hub, template, file, reference);
    this.entityTemplate = entityTemplate;
    this.entityTitle = entityTitle;
    this.templateName = templateName;
  }
}

export { V1Connection, V1ConnectionDisplayed, V1SelectionRectangle, V1TextReference };
