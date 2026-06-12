type MessageRole = 'user' | 'assistant';

type ContextScopeMode = 'auto' | 'this-document';

type ContextChipKind = 'link' | 'document' | 'entity' | 'template' | 'page' | 'file';

type ContextChip = {
  id: string;
  label: string;
  kind: ContextChipKind;
  removable: boolean;
};

type ContextAddOptionId =
  | 'page'
  | 'template'
  | 'connections'
  | 'files'
  | 'entity'
  | 'file';

type ChatMessage = {
  id: string;
  role: MessageRole;
  timestamp: string;
  text: string;
};

export type {
  ChatMessage,
  ContextAddOptionId,
  ContextChip,
  ContextChipKind,
  ContextScopeMode,
  MessageRole,
};
