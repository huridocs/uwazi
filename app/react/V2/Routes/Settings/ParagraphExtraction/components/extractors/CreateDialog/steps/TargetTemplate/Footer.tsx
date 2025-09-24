import React from 'react';
import { Button } from '../../../../../../../../Components/UI/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useCreateExtractorContext } from '../../CreateExtractorContext.js';

const Footer = () => {
  const { targetTemplateId, setStep, setShowModal } = useCreateExtractorContext();
  return (
    <>
      <Button styling="light" onClick={() => setShowModal(false)} className="grow">
        <Translate>Cancel</Translate>
      </Button>
      <Button
        className="grow bg-indigo-800 disabled:opacity-50"
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
