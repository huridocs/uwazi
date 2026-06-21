import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useAtomValue, useSetAtom } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { FeatureToggle } from '#V2/Components/UI/FeatureToggle.js';
import { aiAssistantOpenAtom, userAtom } from '#V2/atoms/index.js';

const AskBertButtonView = () => {
  const setOpen = useSetAtom(aiAssistantOpenAtom);
  const isMobile = useIsMobile();

  return (
    <button
      type="button"
      className="header-bar-button flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1 text-[0.8125rem] font-medium transition-colors"
      onClick={() => setOpen(previous => !previous)}
      aria-label={t('System', 'Ask Bert', null, false)}
      aria-keyshortcuts="Control+K"
    >
      <SparklesIcon className="h-4 w-4" />
      {!isMobile ? (
        <span>
          <Translate>Ask Bert</Translate>
        </span>
      ) : null}
    </button>
  );
};

const AskBertButton = () => {
  const user = useAtomValue(userAtom);

  if (!user?._id) {
    return null;
  }

  return (
    <FeatureToggle feature="aiAssistant">
      <AskBertButtonView />
    </FeatureToggle>
  );
};

export { AskBertButton };
