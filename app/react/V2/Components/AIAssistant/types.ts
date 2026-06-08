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

type CodeBlock = {
  language: string;
  code: string;
};

type AssistantListItem = {
  text: string;
  subItems?: string[];
};

type ChatMessageContent =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: AssistantListItem[] }
  | { kind: 'code'; block: CodeBlock };

type ChatMessage = {
  id: string;
  role: MessageRole;
  timestamp: string;
  content: ChatMessageContent[];
};

export type {
  AssistantListItem,
  ChatMessage,
  ChatMessageContent,
  CodeBlock,
  ContextAddOptionId,
  ContextChip,
  ContextChipKind,
  ContextScopeMode,
  MessageRole,
};
