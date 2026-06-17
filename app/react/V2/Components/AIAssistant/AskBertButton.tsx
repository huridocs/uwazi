import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useSetAtom } from 'jotai';
import { t, Translate } from '#app/I18N/index.js';
import { useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';
import { FeatureToggle } from '#V2/Components/UI/FeatureToggle.js';
import { aiAssistantOpenAtom } from '#V2/atoms/aiAssistantOpenAtom.js';

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

const AskBertButton = () => (
  <FeatureToggle feature="aiAssistant">
    <AskBertButtonView />
  </FeatureToggle>
);

export { AskBertButton };
