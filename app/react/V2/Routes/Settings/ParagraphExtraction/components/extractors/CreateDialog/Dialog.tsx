import React from 'react';
import { Modal } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { AddExtractorSteps } from './steps';
import { useCreateExtractorContext } from './CreateExtractorContext';
import { Steppers } from './Steppers';

const Dialog = () => {
  const { step, setShowModal, targetTemplateOptions } = useCreateExtractorContext();
  const CurrentStepBody = AddExtractorSteps[step].Body;
  const CurrentStepFooter = AddExtractorSteps[step].Footer;

  return (
    <Modal size="xxl">
      <Modal.Header>
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">{AddExtractorSteps[step].title()}</h1>
          <p className="mt-1 text-sm font-light text-gray-500">
            {AddExtractorSteps[step].description()}
          </p>
        </div>

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
          {step === 1 && (
            <span className="mt-5 text-xs font-light text-gray-500 max-w-[500px]">
              <Translate>
                Only templates with at least one rich text property and one numeric property are
                available for selection.
              </Translate>
            </span>
          )}
          {step === 2 && (
            <span className="mt-5 text-xs font-light text-gray-500 max-w-[500px]">
              <Translate>
                Only templates that are not used as source in any other extractor and are not
                selected as target in this extractor are available for selection.
              </Translate>
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
