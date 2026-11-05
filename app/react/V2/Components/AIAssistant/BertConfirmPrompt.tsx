import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import type { AIAssistantToolConfirmPayload } from '#V2/api/aiAssistant/events.js';
import type { ConfirmDecision } from '#V2/api/aiAssistant/confirm.js';

type BertConfirmPromptProps = {
  pending: AIAssistantToolConfirmPayload;
  onDecide: (decision: ConfirmDecision) => void;
};

const BertConfirmPrompt = ({ pending, onDecide }: BertConfirmPromptProps) => (
  <div
    role="alertdialog"
    aria-label={t('System', 'Confirm Bert action', null, false)}
    className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-ink"
  >
    <p className="font-medium">
      <Translate>Bert wants to make a change</Translate>
    </p>
    <p className="mt-1 text-ink-secondary">{pending.description}</p>
    <p className="mt-1 font-mono text-xs text-ink-muted">{pending.toolName}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button type="button" size="small" onClick={() => onDecide('yes')}>
        <Translate>Yes</Translate>
      </Button>
      <Button
        type="button"
        size="small"
        variant="secondary"
        onClick={() => onDecide('yes_dont_ask')}
      >
        <Translate>Yes, don&apos;t ask again this session</Translate>
      </Button>
      <Button type="button" size="small" variant="danger" onClick={() => onDecide('no')}>
        <Translate>No</Translate>
      </Button>
    </div>
  </div>
);

export { BertConfirmPrompt };
export type { BertConfirmPromptProps };
