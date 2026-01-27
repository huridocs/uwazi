import React from 'react';
import { Button } from '#V2/Components/UI/index.js';

import { Translate } from '#app/I18N/index.js';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useCreateExtractorContext } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/CreateExtractorContext.js';

const Footer = () => {
  const { setStep, sourceTemplateId } = useCreateExtractorContext();
  const isDisabled = !sourceTemplateId;

  return (
    <>
      <Button styling="light" onClick={() => setStep(1)} className="grow">
        <Translate>Back</Translate>
      </Button>
      <Button
        className="grow disabled:opacity-50"
        onClick={async () => setStep(3)}
        disabled={isDisabled}
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
