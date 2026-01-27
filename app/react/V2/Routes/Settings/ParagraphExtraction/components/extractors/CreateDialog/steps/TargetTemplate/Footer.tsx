import React from 'react';
import { Button } from '#V2/Components/UI/index.js';

import { Translate } from '#app/I18N/index.js';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useCreateExtractorContext } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/CreateExtractorContext.js';

const Footer = () => {
  const { targetTemplateId, setStep, setShowModal } = useCreateExtractorContext();
  return (
    <>
      <Button styling="light" onClick={() => setShowModal(false)} className="grow">
        <Translate>Cancel</Translate>
      </Button>
      <Button
        className="grow bg-primary-800 disabled:opacity-50"
        onClick={() => setStep(2)}
        disabled={!targetTemplateId}
      >
        <span className="flex items-center justify-center gap-2 flex-nowrap">
          <Translate>Next</Translate>
          <ArrowRightIcon className="w-5" />
        </span>
      </Button>
    </>
  );
};

export { Footer };
