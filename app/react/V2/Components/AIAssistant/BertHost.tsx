import React from 'react';
import { useAtom } from 'jotai';
import { aiAssistantOpenAtom } from '#V2/atoms/aiAssistantOpenAtom.js';
import { BertModal } from './BertModal.js';
import { useBertShortcut } from './useBertShortcut.js';
import type { ReplyScenario } from './useBertState.js';

type BertHostProps = {
  mockReplies?: boolean;
  replyScenario?: ReplyScenario;
};

const BertHost = ({ mockReplies = false, replyScenario = 'normal' }: BertHostProps) => {
  const [open, setOpen] = useAtom(aiAssistantOpenAtom);

  useBertShortcut();

  if (!open) {
    return null;
  }

  return (
    <BertModal
      open
      onClose={() => setOpen(false)}
      mockReplies={mockReplies}
      replyScenario={replyScenario}
    />
  );
};

export { BertHost };
export type { BertHostProps };
