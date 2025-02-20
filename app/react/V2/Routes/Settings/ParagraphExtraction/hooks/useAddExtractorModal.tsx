import React, { useEffect, useState } from 'react';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Modal, Button, MultiselectList } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { Link, useRevalidator } from 'react-router';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { ParagraphExtractorApiPayload } from '../types';
import { NoQualifiedTemplatesMessage } from '../components/NoQualifiedTemplate';
import { PX_LINK_TEMPLATE_CRITERIA } from '../pxConfig';
import { formatTemplatesToOptions } from '../utils/formatters';
import { filterTemplatesWithParagraphs } from '../utils/filterTemplatesWithParagraphs';

interface ExtractorModalProps {
  extractor?: ParagraphExtractorApiPayload;
}

const isActiveStepClassName = (isActive: boolean) => (isActive ? 'bg-indigo-700' : 'bg-gray-200');

const useAddExtractorModal = () => {
  const [showModal, setShowModal] = useState(false);
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

  const AddExtractorModal = ({ extractor }: ExtractorModalProps) => {
    const templates = useAtomValue(templatesAtom);
    const [step, setStep] = useState(1);
    const [sourceTemplateId, setSourceTemplateId] = useState<string>(
      extractor?.sourceTemplateId ?? ''
    );
    const [targetTemplateId, setTargetTemplateId] = useState<string>(
      extractor?.targetTemplateId ?? ''
    );

    const [targetTemplateOptions] = useState(
      formatTemplatesToOptions(templates.filter(filterTemplatesWithParagraphs))
    );
    const [sourceTemplateOptions, setSourceTemplateOptions] = useState(
      formatTemplatesToOptions(
        templates
          .filter(filterTemplatesWithParagraphs)
          .filter(template => template._id !== targetTemplateId)
      )
    );

    useEffect(() => {
      setSourceTemplateOptions(
        formatTemplatesToOptions(templates.filter(template => template._id !== targetTemplateId))
      );
    }, [targetTemplateId, templates]);

    const handleSubmit = async () => {
      try {
        const values = {
          ...extractor,
          sourceTemplateId,
          targetTemplateId,
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
      showModal && (
        <Modal size="xxl">
          <Modal.Header>
            <h1 className="text-lg font-semibold text-gray-900">
              {(step === 1 && <Translate>Target template</Translate>) ||
                (step === 2 && <Translate>Source template</Translate>)}
            </h1>
            <Modal.CloseButton onClick={() => setShowModal(false)} />
          </Modal.Header>

          <Modal.Body className="pt-0">
            <div className={`${step !== 1 ? 'hidden' : ''}`}>
              <MultiselectList
                value={[targetTemplateId]}
                items={targetTemplateOptions}
                onChange={selected => {
                  setTargetTemplateId(selected[0]);
                }}
                singleSelect
                startOnSelected={!!targetTemplateId}
                className="min-h-[327px]"
                hideFilters
                itemContainerClassName="max-h-[327px] overflow-y-auto my-4"
                blankState={<NoQualifiedTemplatesMessage />}
              />
            </div>
            <div className={`${step !== 2 ? 'hidden' : ''}`}>
              <div>
                <MultiselectList
                  value={[sourceTemplateId]}
                  items={sourceTemplateOptions}
                  onChange={selected => {
                    setSourceTemplateId(selected[0]);
                  }}
                  allowSelelectAll={false}
                  singleSelect
                  itemContainerClassName="max-h-[327px] overflow-y-auto my-4"
                  className="min-h-[327px]"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div
                className={`flex justify-center w-full gap-2 ${targetTemplateOptions.length === 0 ? 'opacity-50' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${isActiveStepClassName(step === 1)}`} />
                <div className={`w-2 h-2 rounded-full ${isActiveStepClassName(step === 2)}`} />
              </div>
              {step === 1 && (
                <span
                  className={`mt-5 text-gray-500 font-light text-sm ${targetTemplateOptions.length === 0 ? 'invisible' : ''}`}
                >
                  <Translate>Templates meeting</Translate>{' '}
                  <Link to={PX_LINK_TEMPLATE_CRITERIA} target="_blank" className="underline">
                    <Translate>required criteria</Translate>
                  </Link>
                </span>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="flex flex-col w-full">
              <div className="flex gap-2">
                {step === 1 ? (
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
                ) : (
                  <>
                    <Button styling="light" onClick={() => setStep(1)} className="grow">
                      <Translate>Back</Translate>
                    </Button>
                    <Button
                      className="grow bg-indigo-800 disabled:opacity-50"
                      onClick={async () => handleSubmit()}
                      disabled={!sourceTemplateId}
                    >
                      {extractor ? <Translate>Update</Translate> : <Translate>Add</Translate>}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      )
    );
  };

  return {
    AddExtractorModal,
    setShowModal,
  };
};

export { useAddExtractorModal };
