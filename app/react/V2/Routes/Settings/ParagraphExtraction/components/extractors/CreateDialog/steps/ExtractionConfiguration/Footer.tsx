//////

import React from 'react';
import { Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import * as extractorsAPI from 'V2/api/paragraphExtractor/extractors';
import { notificationAtom } from 'V2/atoms';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';
import { useCreateExtractorContext } from '../../CreateExtractorContext';

const Footer = () => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
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
      setNotifications({
        type: 'success',
        text: <Translate>Paragraph Extractor added</Translate>,
      });
    } catch (e) {
      handleUnexpectedError(e, 'Error creating paragraph extractor');
    }
  };

  return (
    <>
      <Button styling="light" onClick={() => setStep(2)} className="grow">
        <Translate>Back</Translate>
      </Button>
      <Button
        className="grow disabled:opacity-50"
        color="success"
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
