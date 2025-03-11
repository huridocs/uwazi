import React from 'react';
import { Button } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import { useRevalidator } from 'react-router';
import { useSetAtom } from 'jotai';
import { notificationAtom } from 'app/V2/atoms';
import { useAddExtractorContext } from '../../AddExtractorContext';

const Footer = () => {
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);
  const {
    sourceTemplateId,
    setStep,
    targetTemplateId,
    setShowModal,
    richTextId,
    numericId,
    relationshipId,
  } = useAddExtractorContext();

  const handleSubmit = async () => {
    try {
      const values = {
        sourceTemplateId,
        targetTemplateId,
        richTextId,
        numericId,
        relationshipId,
      };
      await extractorsAPI.save(values);
      setShowModal(false);
      await revalidator.revalidate();
      setNotifications({
        type: 'success',
        text: <Translate>Paragraph Extractor added</Translate>,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error saving extractor:', e);
    }
  };

  return (
    <>
      <Button styling="light" onClick={() => setStep(2)} className="grow">
        <Translate>Cancel</Translate>
      </Button>
      <Button
        className="grow disabled:opacity-50"
        color="success"
        onClick={async () => handleSubmit()}
        disabled={!sourceTemplateId}
      >
        <span className="flex items-center justify-center gap-2 flex-nowrap">
          <Translate>Create</Translate>
        </span>
      </Button>
    </>
  );
};

export { Footer };
