import React, { useCallback, useEffect, useRef } from 'react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BertIcon, BertIconStacked } from './BertIcon.js';
import { BertContextBar } from './BertContextBar.js';
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
  className?: string;
};

const BertThinking = () => (
  <div className="flex gap-2 py-2 pl-6">
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-500 [animation-delay:240ms]" />
    </span>
  </div>
);

const BertModal = ({
  open = true,
  onClose,
  mockReplies = false,
  replyScenario = 'normal',
  initialMessages = DEFAULT_BERT_MESSAGES,
  initialContextChips = DEFAULT_CONTEXT_CHIPS,
  className = '',
}: BertModalProps) => {
  const {
    messages,
    contextMode,
    contextModeLabel,
    contextChips,
    draftMessage,
    isReplying,
    isThinking,
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
  } = useBertState({ initialMessages, initialContextChips, mockReplies, replyScenario });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const showWelcome = messages.length === 0 && !isThinking && !replyError;

  useEffect(() => {
    if (showWelcome) return;
    scrollToBottom();
  }, [messages.length, isThinking, replyError, scrollToBottom, showWelcome]);

  if (!open) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4',
        'bg-[color-mix(in_srgb,var(--color-theme-surface-overlay,var(--color-theme-bg-overlay))_65%,transparent)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Bert"
    >
      <div className="flex h-[min(40rem,88vh)] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-paper shadow-lg">
        <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-center gap-1">
              <BertIconStacked
               />
              <h2 className="text-base font-semibold text-ink">Bert</h2>
            </div>
            <kbd className="hidden rounded border border-border bg-vellum px-1.5 py-0.5 text-[0.625rem] font-medium text-ink-muted sm:inline">
              Ctrl K
            </kbd>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-warm hover:text-ink"
            aria-label="Close Bert"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <BertContextBar
          contextMode={contextMode}
          contextModeLabel={contextModeLabel}
          contextChips={contextChips}
          onContextModeChange={setContextMode}
          onRemoveChip={removeContextChip}
          onAddOption={addContextOption}
        />

        <div className="flex min-h-0 flex-1 flex-col bg-paper">
          {needsPasswordUnlock ? (
            <BertPasswordGate onUnlock={unlockWithPassword} />
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4">
                {showWelcome ? (
                  <BertWelcome />
                ) : (
                  <div className="flex flex-col gap-4 pb-2 pt-4">
                    {messages.map(message => (
                      <ChatMessageView
                        key={message.id}
                        message={message}
                        isStreaming={message.id === streamingMessageId}
                        onStreamComplete={finishStreaming}
                        onStreamProgress={scrollToBottom}
                      />
                    ))}
                    {isThinking ? <BertThinking /> : null}
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
              </div>

              <div className="shrink-0 px-4 pb-4 pt-2">
                <ChatInput
                  value={draftMessage}
                  onChange={setDraftMessage}
                  onSubmit={sendMessage}
                  disabled={isReplying}
                />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <BellAlertIcon className="h-3.5 w-3.5 shrink-0" />
                  Long-running tasks keep running in notifications after you close this.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { BertModal };
export type { BertModalProps };
