type Selection = {
  readonly page: number;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
};

type PointerType = 'entity' | 'file' | 'textReference';

interface BasePointer {
  readonly type: PointerType;
  readonly entity: string;
  readonly entityTitle: string;
  readonly entityTemplateId: string;
}

interface EntityPointer extends BasePointer {
  readonly type: 'entity';
}

interface FilePointer extends BasePointer {
  readonly type: 'file';
  readonly file: string;
}

interface TextReferencePointer extends BasePointer {
  readonly type: 'textReference';
  readonly file: string;
  readonly text: string;
  readonly selections: readonly Selection[];
}

type Pointer = EntityPointer | FilePointer | TextReferencePointer;

interface RelationshipView {
  readonly _id: string;
  readonly type: string;
  readonly relationshipTypeName?: string;
  readonly from: Pointer;
  readonly to: Pointer;
}

const isTextReference = (pointer: Pointer): pointer is TextReferencePointer =>
  pointer.type === 'textReference';

const selfPointer = (relationship: RelationshipView, selfSharedId: string): Pointer =>
  relationship.from.entity === selfSharedId ? relationship.from : relationship.to;

const targetPointer = (relationship: RelationshipView, selfSharedId: string): Pointer =>
  relationship.from.entity === selfSharedId ? relationship.to : relationship.from;

const anchorOf = (
  relationship: RelationshipView,
  selfSharedId: string
): TextReferencePointer | undefined => {
  const self = selfPointer(relationship, selfSharedId);
  return isTextReference(self) ? self : undefined;
};

export type {
  Selection,
  Pointer,
  EntityPointer,
  FilePointer,
  TextReferencePointer,
  RelationshipView,
};
export { isTextReference, selfPointer, targetPointer, anchorOf };
