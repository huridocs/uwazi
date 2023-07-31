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

interface WithEntityData {
  entityTitle: string;
  entityTemplateName: string;
}

interface WithRelationshipTypeData {
  relationshipTypeName: string;
}

class EntityPointer extends Pointer {}

class ReadableEntityPointer extends EntityPointer implements WithEntityData {
  readonly entityTitle: string;

  readonly entityTemplateName: string;

  constructor(entity: string, entityTitle: string, entityTemplateName: string) {
    super(entity);
    this.entityTitle = entityTitle;
    this.entityTemplateName = entityTemplateName;
  }
}

class FilePointer extends EntityPointer {
  readonly file: string;

  constructor(entity: string, file: string) {
    super(entity);
    this.file = file;
  }
}

class ReadableFilePointer extends FilePointer implements WithEntityData {
  readonly entityTitle: string;

  readonly entityTemplateName: string;

  constructor(entity: string, file: string, entityTitle: string, entityTemplateName: string) {
    super(entity, file);
    this.entityTitle = entityTitle;
    this.entityTemplateName = entityTemplateName;
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

class ReadableTextReferencePointer extends TextReferencePointer implements WithEntityData {
  readonly entityTitle: string;

  readonly entityTemplateName: string;

  constructor(
    entity: string,
    file: string,
    selections: Selection[],
    text: string,
    entityTitle: string,
    entityTemplateName: string
  ) {
    super(entity, file, selections, text);
    this.entityTitle = entityTitle;
    this.entityTemplateName = entityTemplateName;
  }
}

type ReadablePointers = ReadableEntityPointer | ReadableFilePointer | ReadableTextReferencePointer;

const hasEntityData = (pointer: Pointer): pointer is ReadablePointers =>
  pointer instanceof ReadableEntityPointer ||
  pointer instanceof ReadableFilePointer ||
  pointer instanceof ReadableTextReferencePointer;

const appendEntityDataToPointer = (
  pointer: Pointer,
  entityTitle: string,
  entityTemplateName: string
): ReadablePointers => {
  if (hasEntityData(pointer)) {
    throw new Error('Pointer already has entity data, cannot reassign.');
  }

  if (pointer instanceof TextReferencePointer) {
    return new ReadableTextReferencePointer(
      pointer.entity,
      pointer.file,
      pointer.selections,
      pointer.text,
      entityTitle,
      entityTemplateName
    );
  }

  if (pointer instanceof FilePointer) {
    return new ReadableFilePointer(pointer.entity, pointer.file, entityTitle, entityTemplateName);
  }

  if (pointer instanceof EntityPointer) {
    return new ReadableEntityPointer(pointer.entity, entityTitle, entityTemplateName);
  }

  throw new Error('Unknown pointer type');
};

abstract class BaseRelationship<PointerBase extends Pointer> {
  readonly _id: string;

  readonly from: PointerBase;

  readonly to: PointerBase;

  readonly type: string;

  constructor(_id: string, from: PointerBase, to: PointerBase, type: string) {
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

class Relationship extends BaseRelationship<Pointer> {}

class ReadableRelationship
  extends BaseRelationship<ReadablePointers>
  implements WithRelationshipTypeData
{
  readonly relationshipTypeName: string;

  constructor(
    _id: string,
    from: ReadablePointers,
    to: ReadablePointers,
    type: string,
    relationshipTypeName: string
  ) {
    super(_id, from, to, type);
    this.relationshipTypeName = relationshipTypeName;
  }

  static fromRelationship(
    relationship: Relationship,
    fromEntityTitle: string,
    fromTemplateName: string,
    toEntityTitle: string,
    toTemplateName: string,
    relationshipTypeName: string
  ): ReadableRelationship {
    return new ReadableRelationship(
      relationship._id,
      appendEntityDataToPointer(relationship.from, fromEntityTitle, fromTemplateName),
      appendEntityDataToPointer(relationship.to, toEntityTitle, toTemplateName),
      relationship.type,
      relationshipTypeName
    );
  }
}

export {
  Relationship,
  ReadableRelationship,
  EntityPointer,
  ReadableEntityPointer,
  FilePointer,
  ReadableFilePointer,
  TextReferencePointer,
  ReadableTextReferencePointer,
  Selection,
};
