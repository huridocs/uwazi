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

  isSameRectangleAs(rect: V1SelectionRectangle): boolean {
    return (
      this.page === rect.page &&
      this.top === rect.top &&
      this.left === rect.left &&
      this.height === rect.height &&
      this.width === rect.width
    );
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
    this.file = file;
    this.reference = reference;
  }

  hasFile(): this is V1Connection & { file: string } {
    return !!this.file;
  }

  hasReference(): this is V1Connection & { reference: V1TextReference } {
    return !!this.reference;
  }

  isFilePointer(): this is V1Connection & { file: string; reference: undefined } {
    return this.hasFile() && !this.hasReference();
  }

  hasSameReferenceAs(other: V1Connection): boolean {
    if (!this.hasReference && !other.hasReference) {
      return true;
    }
    if (this.hasReference() !== other.hasReference()) {
      return false;
    }
    if (this.reference!.text !== other.reference!.text) {
      return false;
    }
    if (
      this.reference!.selectionRectangles.length !== other.reference!.selectionRectangles.length
    ) {
      return false;
    }
    return this.reference!.selectionRectangles.every((rect, index) =>
      rect.isSameRectangleAs(other.reference!.selectionRectangles[index])
    );
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
