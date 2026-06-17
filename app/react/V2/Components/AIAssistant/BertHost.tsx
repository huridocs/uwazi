import React from 'react';
import { useAtom } from 'jotai';
import { FeatureToggle } from '#V2/Components/UI/FeatureToggle.js';
import { aiAssistantOpenAtom } from '#V2/atoms/aiAssistantOpenAtom.js';
import { BertModal } from './BertModal.js';
import { useBertShortcut } from './useBertShortcut.js';
import { useBertState } from './useBertState.js';
import type { ReplyScenario } from './useMockBertReplies.js';
import type { ChatMessage, ContextChip } from './types.js';

type BertHostProps = {
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
  initialMessages?: ChatMessage[];
  initialContextChips?: ContextChip[];
};

const BertHostView = ({
  mockReplies = false,
  replyScenario = 'normal',
  initialMessages = [],
  initialContextChips = [],
}: BertHostProps) => {
  const [open, setOpen] = useAtom(aiAssistantOpenAtom);

  useBertShortcut();

  const bertState = useBertState({
    open,
    mockReplies,
    replyScenario,
    initialMessages,
    initialContextChips,
  });

  return <BertModal open={open} onClose={() => setOpen(false)} {...bertState} />;
};

const BertHost = (props: BertHostProps) => (
  <FeatureToggle feature="aiAssistant">
    <BertHostView {...props} />
  </FeatureToggle>
);

export { BertHost };
export type { BertHostProps };
