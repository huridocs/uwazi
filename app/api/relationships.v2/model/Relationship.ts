/* eslint-disable max-params */
/* eslint-disable import/exports-last */
/* eslint-disable max-classes-per-file */
import { SelfReferenceError } from '../errors/relationshipErrors';

export class Selection {
  readonly page: number;

  readonly top: number;

  readonly left: number;

  readonly height: number;

  readonly width: number;

  constructor(page: number, top: number, left: number, height: number, width: number) {
    if (top < 0 || left < 0 || height <= 0 || width <= 0) {
      throw new Error("Reglangle's top, left, height and width must be positive numbers");
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

  abstract equals(pointer: Pointer): boolean;
}

export class EntityPointer extends Pointer {
  equals(pointer: EntityPointer): boolean {
    return pointer instanceof EntityPointer && this.entity === pointer.entity;
  }
}

export class TextReferencePointer extends Pointer {
  readonly file: string;

  readonly selections: Selection[];

  readonly text: string;

  constructor(entity: string, file: string, selections: Selection[], text: string) {
    if (!selections.length) {
      throw new Error('Text references must have at least 1 selection');
    }
    super(entity);
    this.file = file;
    this.selections = selections;
    this.text = text;
  }

  equals(_pointer: TextReferencePointer): boolean {
    return false;
  }
}

export class Relationship {
  readonly _id: string;

  readonly from: Pointer;

  readonly to: Pointer;

  readonly type: string;

  constructor(_id: string, from: Pointer, to: Pointer, type: string) {
    if (from.equals(to)) {
      throw new SelfReferenceError('Cannot create relationship to itself');
    }

    this._id = _id;
    this.from = from;
    this.to = to;
    this.type = type;
  }
}
