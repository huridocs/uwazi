import React, { useEffect, useState } from 'react';
import * as extractorsAPI from 'app/V2/api/paragraphExtractor/extractors';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Modal, Button, MultiselectList } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { Link, useRevalidator } from 'react-router';
import { notificationAtom, templatesAtom } from 'app/V2/atoms';
import { useAtomValue, useSetAtom } from 'jotai';
import { NoQualifiedTemplatesMessage } from '../components/NoQualifiedTemplate';
import { PX_LINK_TEMPLATE_CRITERIA } from '../pxConfig';
import { formatTemplatesToOptions } from '../utils/formatters';
import { filterPXQualifiedTemplates } from '../utils/filterPXQualifiedTemplates';
import { Steppers } from '../components/Steppers';
import { Select } from 'app/V2/Components/Forms';

const useAddExtractorModal = () => {
  const [showModal, setShowModal] = useState(false);
  const revalidator = useRevalidator();
  const setNotifications = useSetAtom(notificationAtom);

  const AddExtractorModal = () => {
    const templates = useAtomValue(templatesAtom);
    const [sourceTemplateId, setSourceTemplateId] = useState<string>('');
    const [targetTemplateId, setTargetTemplateId] = useState<string>('');

    const [targetTemplateOptions] = useState(
      formatTemplatesToOptions(templates.filter(filterPXQualifiedTemplates))
    );
    const [sourceTemplateOptions, setSourceTemplateOptions] = useState(
      formatTemplatesToOptions(
        templates
          .filter(filterPXQualifiedTemplates)
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

    const STEPS = {
      1: {
        title: 'Target template',
        body: (
          <div>
            <MultiselectList
              value={[targetTemplateId]}
              items={targetTemplateOptions}
              onChange={selected => {
                setTargetTemplateId(selected[0]);
              }}
              singleSelect
              className="min-h-[500px]"
              hideFilters
              itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
              blankState={<NoQualifiedTemplatesMessage />}
            />
          </div>
        ),
        footer: (
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
        ),
      },
      2: {
        title: 'Extraction configuration',
        body: (
          <div className="flex flex-col gap-4 min-h-[500px] my-4">
            <div>
              <Select
                id="rich-text-property"
                label={
                  <Translate className="text-sm font-semibold text-gray-900">
                    Paragraph text extraction property (rich text):
                  </Translate>
                }
                value={''}
                options={[]}
                onChange={() => {}}
              />
            </div>
            <div>
              <Select
                id="numeric-text-property"
                label={
                  <Translate className="text-sm font-semibold text-gray-900">
                    Paragraph text extraction property (numeric text):
                  </Translate>
                }
                value={''}
                options={[]}
                onChange={() => {}}
              />
            </div>
            <hr className="w-5" />
            <div>
              <Select
                id="relationship-type"
                label={
                  <Translate className="text-sm font-semibold text-gray-900">
                    Relationship type:
                  </Translate>
                }
                value={''}
                options={[]}
                onChange={() => {}}
              />
            </div>
          </div>
        ),
        footer: (
          <>
            <Button styling="light" onClick={() => setStep(1)} className="grow">
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow disabled:opacity-50" onClick={async () => setStep(3)}>
              <span className="flex items-center justify-center gap-2 flex-nowrap">
                <Translate>Next</Translate>
                <ArrowRightIcon className="w-5" />
              </span>
            </Button>
          </>
        ),
      },
      3: {
        title: 'Source template',
        body: (
          <div>
            <MultiselectList
              value={[sourceTemplateId]}
              items={sourceTemplateOptions}
              onChange={selected => {
                setSourceTemplateId(selected[0]);
              }}
              allowSelelectAll={false}
              singleSelect
              className="min-h-[500px]"
              itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
            />
          </div>
        ),
        footer: (
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
        ),
      },
    };

    const [step, setStep] = useState<keyof typeof STEPS>(1);

    return (
      showModal && (
        <Modal size="xxl">
          <Modal.Header>
            <h1 className="text-lg font-semibold text-gray-900">{STEPS[step].title}</h1>
            <Modal.CloseButton onClick={() => setShowModal(false)} />
          </Modal.Header>
          <Modal.Body className="pt-0">
            {STEPS[step].body}
            <div className="flex flex-col">
              <Steppers
                step={step}
                steps={Object.keys(STEPS).length}
                isDisabled={targetTemplateOptions.length === 0}
              />
              {step !== 3 && (
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
              <div className="flex gap-2">{STEPS[step].footer}</div>
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
