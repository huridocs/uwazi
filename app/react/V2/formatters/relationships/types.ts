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
  /** True when the self-side hub connection carries the relation type template. */
  readonly relationTypeOnSelf: boolean;
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

type RelationshipDirection = 'incoming' | 'outgoing' | 'both';

const directionOf = (
  relationship: RelationshipView,
  selfSharedId: string
): RelationshipDirection => {
  const selfAnchored = isTextReference(selfPointer(relationship, selfSharedId));
  const targetAnchored = isTextReference(targetPointer(relationship, selfSharedId));
  if (selfAnchored && targetAnchored) return 'both';
  if (selfAnchored) return 'outgoing';
  if (targetAnchored) return 'incoming';
  if (relationship.relationTypeOnSelf) return 'incoming';
  return 'outgoing';
};

export type {
  Selection,
  Pointer,
  EntityPointer,
  FilePointer,
  TextReferencePointer,
  RelationshipView,
  RelationshipDirection,
};
export { isTextReference, selfPointer, targetPointer, anchorOf, directionOf };
