//////

import React from 'react';
import { Button } from '#V2/Components/UI/index.js';
import { t, Translate } from '#app/I18N/index.js';
import * as extractorsAPI from '#V2/api/paragraphExtractor/extractors.js';
import { useRevalidator } from 'react-router';
import { handleUnexpectedError } from '#app/V2/shared/errorUtils.js';
import { isClient } from '#app/utils/index.js';
import { useCreateExtractorContext } from '../../CreateExtractorContext.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const Footer = () => {
  const revalidator = useRevalidator();
  const { notify } = useRequestStatus();
  const {
    sourceTemplateId,
    setStep,
    targetTemplateId,
    setShowModal,
    paragraphPropertyId,
    paragraphNumberPropertyId,
    targetRelationshipId,
    sourceRelationshipId,
  } = useCreateExtractorContext();

  const isDisabled =
    !paragraphPropertyId ||
    !paragraphNumberPropertyId ||
    !targetRelationshipId ||
    !sourceRelationshipId ||
    !sourceTemplateId ||
    !targetTemplateId;

  const handleSubmit = async () => {
    try {
      const values = {
        sourceTemplateId,
        targetTemplateId,
        paragraphPropertyId,
        paragraphNumberPropertyId,
        targetRelationshipId,
        sourceRelationshipId,
      };
      await extractorsAPI.save(values);
      setShowModal(false);
      await revalidator.revalidate();
      notify('success', t('System', 'Paragraph Extractor added', null, false));
    } catch (e) {
      if (isClient) {
        handleUnexpectedError(e, 'Error creating paragraph extractor');
      }
    }
  };

  return (
    <>
      <Button variant="ghost" onClick={() => setStep(2)} className="grow">
        <Translate>Back</Translate>
      </Button>
      <Button
        className="grow disabled:opacity-50"
        variant="success"
        onClick={async () => handleSubmit()}
        disabled={isDisabled}
      >
        <span className="flex items-center justify-center gap-2 flex-nowrap">
          <Translate>Create</Translate>
        </span>
      </Button>
    </>
  );
};

export { Footer };
