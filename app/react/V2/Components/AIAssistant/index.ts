export { AskBertButton } from './AskBertButton.js';
export { BertHost } from './BertHost.js';
export { BertModal } from './BertModal.js';
export { useBertShortcut } from './useBertShortcut.js';
export { BertContextBar } from './BertContextBar.js';
export { BertIcon, BertIconStacked } from './BertIcon.js';
export { BertWelcome } from './BertWelcome.js';
export { ChatMessageView } from './ChatMessage.js';
export { ChatInput } from './ChatInput.js';
export { useBertState, REPLY_DELAYS_MS } from './useBertState.js';
export { AIAssistantPanel } from './AIAssistantPanel.js';
export {
  buildContextSummary,
  CONTEXT_ADD_LABELS,
  DEFAULT_BERT_MESSAGES,
  DEFAULT_CONTEXT_CHIPS,
} from './mockBertData.js';
export type { BertHostProps } from './BertHost.js';
export type { BertModalProps } from './BertModal.js';
export type { BertContextBarProps } from './BertContextBar.js';
export type { ReplyScenario, UseBertStateOptions } from './useBertState.js';
export type { AIAssistantPanelProps } from './AIAssistantPanel.js';
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
} from './types.js';

// Legacy alias
export { BertIcon as AIAssistantIcon } from './BertIcon.js';
