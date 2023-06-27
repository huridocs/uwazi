/* eslint-disable max-params */
/* eslint-disable max-classes-per-file */
class Selection {
  readonly page: number;

  readonly top: number;

  readonly left: number;

  readonly height: number;

  readonly width: number;

  constructor(page: number, top: number, left: number, height: number, width: number) {
    if (top < 0 || left < 0 || height <= 0 || width <= 0) {
      throw new Error(
        "Rectangle's height and width must be positive, and top and left must be zero or positive."
      );
    }

    if (page < 1) {
      throw new Error('Page number must be positive');
    }

    this.page = page;
    this.top = top;
    this.left = left;
    this.height = height;
    this.width = width;
  }
}

abstract class Pointer {
  readonly entity: string;

  constructor(entity: string) {
    this.entity = entity;
  }
}

class EntityPointer extends Pointer {}

class FilePointer extends EntityPointer {
  readonly file: string;

  constructor(entity: string, file: string) {
    super(entity);
    this.file = file;
  }
}

class TextReferencePointer extends FilePointer {
  readonly selections: Selection[];

  readonly text: string;

  constructor(entity: string, file: string, selections: Selection[], text: string) {
    if (!selections.length) {
      throw new Error('Text references must have at least 1 selection');
    }
    super(entity, file);
    this.selections = selections;
    this.text = text;
  }
}

class Relationship {
  readonly _id: string;

  readonly from: Pointer;

  readonly to: Pointer;

  readonly type: string;

  constructor(_id: string, from: Pointer, to: Pointer, type: string) {
    this._id = _id;
    this.from = from;
    this.to = to;
    this.type = type;
  }

  static getSharedIds(relationships: Relationship[]): Set<string> {
    const entities = new Set(
      relationships.flatMap(relationship => [relationship.from.entity, relationship.to.entity])
    );
    return entities;
  }
}

export { Relationship, EntityPointer, FilePointer, TextReferencePointer, Selection };
