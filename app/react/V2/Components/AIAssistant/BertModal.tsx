/* eslint-disable react/no-multi-comp */
import React, { useCallback, useEffect, useRef } from 'react';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { ChatBubbleBottomCenterTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { BertIconStacked } from './BertIcon.js';
import { BertContextBar } from './BertContextBar.js';
import { BertPasswordGate } from './BertPasswordGate.js';
import { BertWelcome } from './BertWelcome.js';
import { ChatMessageView } from './ChatMessage.js';
import { ChatInput } from './ChatInput.js';
import type { ContextAddOptionId, ContextChip, ContextScopeMode, ChatMessage } from './types.js';

type BertModalProps = {
  open?: boolean;
  onClose?: () => void;
  messages: ChatMessage[];
  contextMode: ContextScopeMode;
  contextModeLabel: string;
  contextChips: ContextChip[];
  draftMessage: string;
  isReplying: boolean;
  isThinking: boolean;
  jobProgress: string | null;
  streamingMessageId: string | null;
  replyError: string | null;
  needsPasswordUnlock: boolean;
  setContextMode: (mode: ContextScopeMode) => void;
  setDraftMessage: (value: string) => void;
  removeContextChip: (chipId: string) => void;
  addContextOption: (optionId: ContextAddOptionId) => void;
  unlockWithPassword: (password: string) => void;
  sendMessage: () => void;
  finishStreaming: () => void;
  clearChat: () => void | Promise<void>;
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
  messages,
  contextMode,
  contextModeLabel,
  contextChips,
  draftMessage,
  isReplying,
  isThinking,
  jobProgress,
  streamingMessageId,
  replyError,
  needsPasswordUnlock,
  setContextMode,
  setDraftMessage,
  removeContextChip,
  addContextOption,
  unlockWithPassword,
  sendMessage,
  finishStreaming,
  clearChat,
}: BertModalProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      scrollIntoView(messagesEndRef.current, { behavior: 'smooth' });
    }
  }, []);

  const showWelcome = messages.length === 0 && !isThinking && !replyError;
  const canClearChat = messages.length > 0 || isThinking || Boolean(replyError);

  const renderModalBody = () => {
    if (needsPasswordUnlock) {
      return <BertPasswordGate onUnlock={unlockWithPassword} />;
    }

    if (showWelcome) {
      return <BertWelcome />;
    }

    return (
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
    );
  };

  useEffect(() => {
    if (!open || showWelcome) return;
    scrollToBottom();
  }, [open, messages.length, isThinking, jobProgress, replyError, scrollToBottom, showWelcome]);

  if (!open) {
    return null;
  }

  return (
    <Modal size="xxxl" id="bert-modal" ariaLabel="Bert">
      <Modal.Header className="!px-4 !py-3 shrink-0 items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex items-center gap-1">
            <BertIconStacked />
            <h2 className="text-base font-semibold text-ink">
              <Translate>Bert</Translate>
            </h2>
          </div>
          <kbd className="rounded border border-border bg-warm px-1.5 py-0.5 text-[0.625rem] font-medium text-ink-muted sm:inline">
            <Translate>Ctrl K</Translate>
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
            <Translate>New conversation</Translate>
          </Button>
        </div>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      {!needsPasswordUnlock ? (
        <BertContextBar
          contextMode={contextMode}
          contextModeLabel={contextModeLabel}
          contextChips={contextChips}
          onContextModeChange={setContextMode}
          onRemoveChip={removeContextChip}
          onAddOption={addContextOption}
        />
      ) : null}
      <Modal.Body className="min-h-[32rem]">{renderModalBody()}</Modal.Body>

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
            <Translate>Some tasks may take a while. Bert will reply when it&apos;s done.</Translate>
          </p>
        </Modal.Footer>
      ) : null}
    </Modal>
  );
};

export { BertModal };
export type { BertModalProps };
