import React from 'react';
import { Modal } from 'V2/Components/UI';
import { Link } from 'react-router';
import { Translate } from 'app/I18N';
import { AddExtractorSteps } from './steps';
import { useCreateExtractorContext } from './CreateExtractorContext';
import { Steppers } from './Steppers';

const TEMPLATE_CRITERIA_LINK =
  'https://uwazi.readthedocs.io/en/latest/admin-docs/paragraph-extraction.html';

const Dialog = () => {
  const { step, setShowModal, targetTemplateOptions } = useCreateExtractorContext();
  const CurrentStepBody = AddExtractorSteps[step].Body;
  const CurrentStepFooter = AddExtractorSteps[step].Footer;

  return (
    <Modal size="xxl">
      <Modal.Header>
        <h1 className="text-lg font-semibold text-gray-900">
          <Translate>{AddExtractorSteps[step].title}</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body className="pt-0">
        <CurrentStepBody />
        <div className="flex flex-col">
          <Steppers
            step={step}
            steps={Object.keys(AddExtractorSteps).length}
            isDisabled={targetTemplateOptions.length === 0}
          />
          {step !== 3 && (
            <span
              className={`mt-5 text-gray-500 font-light text-sm ${targetTemplateOptions.length === 0 ? 'invisible' : ''}`}
            >
              <Translate>Templates meeting</Translate>{' '}
              <Link to={TEMPLATE_CRITERIA_LINK} target="_blank" className="underline">
                <Translate>required criteria</Translate>
              </Link>
            </span>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <div className="flex gap-2">
            <CurrentStepFooter />
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { Dialog };
