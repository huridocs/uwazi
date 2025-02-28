import React from 'react';
import { Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useAddExtractorContext } from '../../AddExtractorContext';

const Footer = () => {
  const { setStep, richTextId, numericId, relationshipId } = useAddExtractorContext();
  const isDisabled = !richTextId || !numericId || !relationshipId;
  console.log({ richTextId, numericId, relationshipId });
  return (
    <>
      <Button styling="light" onClick={() => setStep(1)} className="grow">
        <Translate>Cancel</Translate>
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
