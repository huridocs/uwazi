export { aiAssistantEvents } from './events.js';
export type {
  AIAssistantErrorPayload,
  AIAssistantProgressPayload,
  AIAssistantReplyPayload,
  AIAssistantToolActivityPayload,
  AIAssistantToolConfirmPayload,
} from './events.js';
export { sendMessage } from './messages.js';
export type { SendMessageInput, SendMessageResponse } from './messages.js';
export { getSettings, saveSettings } from './settings.js';
export type { AIAssistantClientSettings, AIAssistantProvider } from './settings.js';
export { clearConversation, confirmTool } from './confirm.js';
export type { ConfirmDecision, ConfirmToolInput } from './confirm.js';
export type {
  ChatMessage,
  ContextAddOptionId,
  ContextChip,
  ContextChipKind,
  ContextScopeMode,
  MessageRole,
} from './types.js';
