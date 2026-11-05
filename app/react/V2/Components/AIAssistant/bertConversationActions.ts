import { sendMessage as sendAIAssistantMessage } from '#V2/api/aiAssistant/messages.js';
import { clearConversation, confirmTool } from '#V2/api/aiAssistant/confirm.js';
import type { ConfirmDecision } from '#V2/api/aiAssistant/confirm.js';
import { createId, formatTime } from './bertChatUtils.js';
import type { ChatSetters } from './bertSocketHandlers.js';
import type { BertJobRefs } from './useBertChatState.js';
import type { ChatMessage, ContextChip } from './types.js';
import type { useMockBertReplies } from './useMockBertReplies.js';

type SendMockReply = ReturnType<typeof useMockBertReplies>['sendMockReply'];

type SendBertMessageInput = {
  text: string;
  mockReplies: boolean;
  requiresPassword: boolean;
  password: string | null;
  conversationJobId: string | null;
  contextChips: ContextChip[];
  sendMockReply: SendMockReply;
  setters: ChatSetters & { setDraftMessage: (value: string) => void };
  jobRefs: { current: BertJobRefs };
};

const beginUserTurn = (
  text: string,
  setters: ChatSetters & { setDraftMessage: (value: string) => void },
  jobRefs: { current: BertJobRefs }
) => {
  const userMessage: ChatMessage = {
    id: createId(),
    role: 'user',
    timestamp: formatTime(),
    text,
  };

  setters.setMessages(current => [...current, userMessage]);
  setters.setDraftMessage('');
  setters.setReplyError(null);
  jobRefs.current.isThinking = true;
  setters.setIsThinking(true);
  setters.setJobProgress(null);
  setters.setStreamingMessageId(null);
  setters.setPendingConfirm(null);
  setters.setToolActivity(null);
};

const failTurn = (setters: ChatSetters, jobRefs: { current: BertJobRefs }, error: string) => {
  setters.setReplyError(error);
  jobRefs.current.isThinking = false;
  setters.setIsThinking(false);
};

const sendLiveMessage = async (input: SendBertMessageInput) => {
  if (input.requiresPassword && !input.password) {
    failTurn(input.setters, input.jobRefs, 'Enter your Uwazi password to send messages.');
    return;
  }

  const [response, error] = await sendAIAssistantMessage({
    message: input.text,
    password: input.password ?? undefined,
    jobId: input.conversationJobId ?? undefined,
  });

  if (error || !response?.jobId) {
    failTurn(
      input.setters,
      input.jobRefs,
      error?.json?.prettyMessage ||
        'Bert could not complete your request. Check your connection and try again.'
    );
    return;
  }

  const jobId = String(response.jobId);
  input.jobRefs.current.conversationJobId = jobId;
  input.jobRefs.current.pendingJobId = jobId;
};

const sendBertMessage = async (input: SendBertMessageInput) => {
  beginUserTurn(input.text, input.setters, input.jobRefs);

  if (input.mockReplies) {
    input.sendMockReply(
      input.text,
      input.contextChips,
      reply => {
        input.setters.setMessages(current => [...current, reply]);
        input.setters.setStreamingMessageId(reply.id);
      },
      error => input.setters.setReplyError(error),
      () => {
        input.jobRefs.current.isThinking = false;
        input.setters.setIsThinking(false);
      }
    );
    return;
  }

  await sendLiveMessage(input);
};

const respondToBertConfirm = async (input: {
  pendingConfirm: { jobId: string; toolCallId: string } | null;
  decision: ConfirmDecision;
  setters: ChatSetters;
  jobRefs: { current: BertJobRefs };
}) => {
  if (!input.pendingConfirm) {
    return;
  }

  const [response, error] = await confirmTool({
    jobId: input.pendingConfirm.jobId,
    toolCallId: input.pendingConfirm.toolCallId,
    decision: input.decision,
  });

  if (error || !response) {
    input.setters.setReplyError(
      error?.json?.prettyMessage || 'Could not send your decision. Try again.'
    );
    return;
  }

  input.setters.setPendingConfirm(null);
  input.setters.setIsThinking(true);
  if (input.decision !== 'no') {
    input.jobRefs.current.isThinking = true;
  }
};

const resetEmptyChat = (
  setters: ChatSetters & { setDraftMessage: (value: string) => void },
  jobRefs: { current: BertJobRefs }
) => {
  jobRefs.current = { conversationJobId: null, pendingJobId: null, isThinking: false };
  setters.setMessages(() => []);
  setters.setDraftMessage('');
  setters.setReplyError(null);
  setters.setIsThinking(false);
  setters.setJobProgress(null);
  setters.setStreamingMessageId(null);
  setters.setPendingConfirm(null);
  setters.setToolActivity(null);
};

const clearBertChat = async (input: {
  mockReplies: boolean;
  setters: ChatSetters & { setDraftMessage: (value: string) => void };
  jobRefs: { current: BertJobRefs };
}) => {
  const jobId = input.jobRefs.current.conversationJobId;
  resetEmptyChat(input.setters, input.jobRefs);
  if (jobId && !input.mockReplies) {
    await clearConversation(jobId);
  }
};

export { clearBertChat, respondToBertConfirm, sendBertMessage };
export type { SendMockReply, SendBertMessageInput };
