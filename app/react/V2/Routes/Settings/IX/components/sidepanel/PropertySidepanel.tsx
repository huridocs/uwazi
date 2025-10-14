import React, { useEffect, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useAtom, useSetAtom } from 'jotai';
import { useLoaderData } from 'react-router';
import loadable from '@loadable/component';
import { FetchResponseError } from 'shared/JSONRequest';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientTemplateSchema } from 'app/istore';
import { Button, Sidepanel, ToggleButton, VerticalDrawer, Truncate } from 'V2/Components/UI';
import { notificationAtom } from 'V2/atoms';
import { Checkbox } from 'V2/Components/Forms';
import {
  coerceValue,
  getFormValue,
  handleEntitySave,
  loadSidepanelData,
  SELECT_TYPES,
} from '../../helpers';
import { SidepanelForms } from './SidepanelForms';
import { highlightsAtom, selectionErrorAtom, textSelectionAtom } from '../atoms';
import { selectAndSearchAtom } from '../atoms/selectAndSearchAtom';
import { SidepanelProps } from './types';

//This is imported via loadable due to https://github.com/huridocs/uwazi/issues/7808
const TextProperty = loadable(async () => (await import('../TextProperty')).TextProperty);

// eslint-disable-next-line max-statements
const PropertySidepanel = ({
  showSidepanel,
  setShowSidepanel,
  suggestion,
  onEntitySave,
  property,
  extractor,
}: SidepanelProps) => {
  const { templates } = useLoaderData() as { templates: ClientTemplateSchema[] };
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const [highlights, setHighlights] = useAtom(highlightsAtom);
  const [selectionError, setSelectionError] = useAtom(selectionErrorAtom);
  const [selectedText, setSelectedText] = useAtom(textSelectionAtom);
  const [selectAndSearch, setSelectAndSearch] = useAtom(selectAndSearchAtom);
  const setNotifications = useSetAtom(notificationAtom);

  const templateId = suggestion?.entityTemplateId;
  const template = templates.find(t => t._id.toString() === templateId);

  const handleClose = () => {
    setEntity(undefined);
    setShowSidepanel(false);
    setSelectAndSearch(false);
    setSelectedText(undefined);
    setSelectionError(undefined);
  };

  const formContext = useForm({
    values: {
      field: getFormValue(suggestion, entity, property?.type) || '',
      inTrainingSet: suggestion?.useForTraining,
    },
  });

  const {
    handleSubmit,
    setValue,
    control,
    formState: { isSubmitting, dirtyFields },
  } = formContext;

  useEffect(() => {
    if (showSidepanel && suggestion) {
      loadSidepanelData(suggestion)
        .then(({ entity: suggestionEntity }) => {
          setEntity(suggestionEntity);
        })
        .catch(e => {
          throw e;
        });
    }
  }, [showSidepanel, suggestion]);

  useEffect(() => {
    if (dirtyFields.field) {
      setValue('inTrainingSet', true, { shouldDirty: true });
    }
  }, [dirtyFields.field, setValue]);

  // eslint-disable-next-line max-statements
  const onSubmit = async (value: {
    field: PropertyValueSchema | PropertyValueSchema[] | undefined;
  }) => {
    if (dirtyFields.field) {
      const savedEntity = await handleEntitySave(entity, property, value.field, template);

      if (savedEntity instanceof FetchResponseError) {
        const details = (savedEntity as FetchResponseError)?.json.prettyMessage;

        setNotifications({ type: 'error', text: 'An error occurred', details });
      } else if (savedEntity) {
        if (savedEntity) {
          setEntity(savedEntity);
        }

        setNotifications({ type: 'success', text: 'Saved successfully.' });
      }
    }

    if (suggestion?._id && dirtyFields.inTrainingSet) {
      onEntitySave([suggestion?._id], formContext.getValues().inTrainingSet || false);
    }

    handleClose();
  };

  const handleClickToFill = async () => {
    if (selectedText) {
      if (property?.type === 'date' || property?.type === 'numeric') {
        const coercedValue = await coerceValue(property.type, selectedText.text, entity?.language);

        if (!coercedValue?.success) {
          setSelectionError('Value cannot be transformed to the correct type');
        } else {
          setValue('field', coercedValue.value, { shouldDirty: true });
          setSelectionError(undefined);
        }
      } else {
        const sanitizedText = selectedText.text?.replace(/[\n\r]/g, ' ') || '';
        setValue('field', sanitizedText, { shouldDirty: true });
      }
    }
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      size="large"
      title={<Truncate maxLength={80}>{entity?.title}</Truncate>}
      closeSidepanelFunction={handleClose}
    >
      <Sidepanel.Body className="overflow-y-auto">
        <TextProperty
          propertyName={suggestion?.extractorSource.property}
          entity={entity}
          template={template}
          onSelect={selection => {
            setSelectedText(selection);
          }}
          onDeselect={() => {
            setSelectedText(undefined);
          }}
        />
      </Sidepanel.Body>
      <Sidepanel.Footer className="sticky bg-white border-t border-gray-200 shadow-[0_-6px_12px_-3px_rgba(0,0,0,0.15)]">
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <FormProvider {...formContext}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <VerticalDrawer
              defaultOpen
              title={
                <div className="flex gap-4 items-center">
                  <Translate
                    className={`font-semibold uppercase ${selectionError ? 'text-pink-600' : 'text-gray-500'}`}
                    context={templateId}
                  >
                    {property?.label}
                  </Translate>
                  {SELECT_TYPES.includes(property?.type || '') && (
                    <ToggleButton
                      size="small"
                      onToggle={() => setSelectAndSearch(!selectAndSearch)}
                    >
                      <Translate className="font-medium text-xs text-gray-900">
                        Select & Search
                      </Translate>
                    </ToggleButton>
                  )}
                  {selectionError && <span className="text-pink-600">{selectionError}</span>}
                </div>
              }
            >
              <SidepanelForms
                property={property}
                extractor={extractor}
                suggestion={suggestion}
                handleClickToFill={handleClickToFill}
                clearSelectionButton={
                  <div className="sm:text-right" data-testid="ix-clear-button-container">
                    <Button
                      type="button"
                      styling="outline"
                      disabled={Boolean(!highlights) || isSubmitting}
                      onClick={() => {
                        setHighlights(undefined);
                      }}
                    >
                      <Translate>Clear</Translate>
                    </Button>
                  </div>
                }
              />
            </VerticalDrawer>
            <div className="flex justify-between gap-2 px-4 py-2 border-t border-gray-200">
              <Button type="button" styling="outline" disabled={isSubmitting} onClick={handleClose}>
                <Translate>Cancel</Translate>
              </Button>
              <div className="flex flex-row gap-2 items-center">
                <Controller
                  control={control}
                  name="inTrainingSet"
                  disabled={isSubmitting}
                  render={({ field: { onChange, name, value } }) => (
                    <Checkbox
                      onChange={onChange}
                      disabled={isSubmitting}
                      checked={value}
                      name={name}
                      label={<Translate>Use for training</Translate>}
                    />
                  )}
                />
                <Button type="submit" disabled={isSubmitting} color="success">
                  <Translate>Accept</Translate>
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { PropertySidepanel };
