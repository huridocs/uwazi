import React, { useCallback, useEffect, useRef } from 'react';
import { ChatBubbleBottomCenterTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { BertIconStacked } from './BertIcon.js';
import { BertPasswordGate } from './BertPasswordGate.js';
import { BertWelcome } from './BertWelcome.js';
import { ChatMessageView } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';
import { useBertState } from './useBertState.js';
import type { ReplyScenario } from './useBertState.js';
import type { ChatMessage, ContextChip } from './types.js';
import { DEFAULT_BERT_MESSAGES, DEFAULT_CONTEXT_CHIPS } from './mockBertData.js';

type BertModalProps = {
  open?: boolean;
  onClose?: () => void;
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
  initialMessages?: ChatMessage[];
  initialContextChips?: ContextChip[];
};

const BertThinking = ({ progress }: { progress?: string | null }) => (
  <div className="flex gap-2 py-2">
    <BertIconStacked className="mt-1" />
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary-100 px-2.5 py-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:240ms]" />
      </span>
      {progress ? <p className="text-xs leading-relaxed text-ink-muted">{progress}</p> : null}
    </div>
  </div>
);

const BertModal = ({
  open = true,
  onClose,
  mockReplies = false,
  replyScenario = 'normal',
  initialMessages = DEFAULT_BERT_MESSAGES,
  initialContextChips = DEFAULT_CONTEXT_CHIPS,
}: BertModalProps) => {
  const {
    messages,
    draftMessage,
    isReplying,
    isThinking,
    jobProgress,
    streamingMessageId,
    replyError,
    needsPasswordUnlock,
    setDraftMessage,
    unlockWithPassword,
    sendMessage,
    finishStreaming,
    clearChat,
  } = useBertState({ initialMessages, initialContextChips, mockReplies, replyScenario });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const showWelcome = messages.length === 0 && !isThinking && !replyError;
  const canClearChat = messages.length > 0 || isThinking || Boolean(replyError);

  useEffect(() => {
    if (!open || showWelcome) return;
    scrollToBottom();
  }, [open, messages.length, isThinking, jobProgress, replyError, scrollToBottom, showWelcome]);

  if (!open) {
    return null;
  }

  return (
    <Modal size="xxxl" id="bert-modal">
      <Modal.Header className="!px-4 !py-3 shrink-0 items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center gap-1">
            <BertIconStacked />
            <h2 className="text-base font-semibold text-ink">Bert</h2>
          </div>
          <kbd className="rounded border border-border bg-warm px-1.5 py-0.5 text-[0.625rem] font-medium text-ink-muted sm:inline">
            Ctrl K
          </kbd>
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={clearChat}
            disabled={!canClearChat}
            className="inline-flex items-center gap-1"
          >
            <ChatBubbleBottomCenterTextIcon className="h-3.5 w-3.5 shrink-0" />
            New conversation
          </Button>
        </div>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body className="min-h-[32rem]">
        {needsPasswordUnlock ? (
          <BertPasswordGate onUnlock={unlockWithPassword} />
        ) : showWelcome ? (
          <BertWelcome />
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-2 pt-4">
            {messages.map(message => (
              <ChatMessageView
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
                onStreamComplete={finishStreaming}
                onStreamProgress={scrollToBottom}
              />
            ))}
            {isThinking ? <BertThinking progress={jobProgress} /> : null}
            {replyError ? (
              <div
                role="alert"
                className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800"
              >
                {replyError}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Modal.Body>

      {!needsPasswordUnlock ? (
        <Modal.Footer className="shrink-0 !border-0 px-4 pb-4 pt-2">
          <ChatInput
            value={draftMessage}
            onChange={setDraftMessage}
            onSubmit={sendMessage}
            disabled={isReplying}
          />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <ClockIcon className="h-3.5 w-3.5 shrink-0" />
            Some tasks may take a while. Bert will reply when it&apos;s done.
          </p>
        </Modal.Footer>
      ) : null}
    </Modal>
  );
};

export { BertModal };
export type { BertModalProps };
