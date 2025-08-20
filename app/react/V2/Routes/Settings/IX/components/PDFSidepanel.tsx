/* eslint-disable max-lines */
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useLoaderData } from 'react-router';
import { FileType } from 'shared/types/fileType';
import { FetchResponseError } from 'shared/JSONRequest';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { Translate } from 'app/I18N';
import { ClientEntitySchema, ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { Button, Sidepanel, ToggleButton, Truncate, VerticalDrawer } from 'V2/Components/UI';
import { PDF, selectionHandlers } from 'V2/Components/PDFViewer';
import { notificationAtom, pdfScaleAtom } from 'V2/atoms';
import { secondsToISODate } from 'V2/shared/dateHelpers';
import { TableSuggestion } from '../types';
import {
  coerceValue,
  getFormValue,
  handleEntitySave,
  loadSidepanelData,
  SELECT_TYPES,
} from '../helpers';
import { SidepanelForms } from './SidepanelForms';
import { highlightsAtom, selectionErrorAtom, textSelectionAtom, selectionsAtom } from './atoms';
import { selectAndSearchAtom } from './atoms/selectAndSearchAtom';

interface PDFSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  suggestion?: TableSuggestion;
  onEntitySave: () => any;
  property?: ClientPropertySchema;
}

enum HighlightColors {
  CURRENT = '#B1F7A3',
  NEW = '#F27DA5',
}

const PDFSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  suggestion,
  onEntitySave,
  property,
}: PDFSidepanelProps) => {
  const { templates } = useLoaderData() as { templates: ClientTemplateSchema[] };
  const [pdfFile, setPdfFile] = useState<FileType | undefined>();
  const [entity, setEntity] = useState<ClientEntitySchema>();
  const [highlights, setHighlights] = useAtom(highlightsAtom);
  const [selectionError, setSelectionError] = useAtom(selectionErrorAtom);
  const [selectedText, setSelectedText] = useAtom(textSelectionAtom);
  const [selectAndSearch, setSelectAndSearch] = useAtom(selectAndSearchAtom);
  const selections = useAtomValue(selectionsAtom);
  const pdfScalingValue = useAtomValue(pdfScaleAtom);
  const setNotifications = useSetAtom(notificationAtom);
  const setSelections = useSetAtom(selectionsAtom);

  useEffect(() => {
    if (showSidepanel && suggestion) {
      loadSidepanelData(suggestion)
        .then(({ file, entity: suggestionEntity }) => {
          setPdfFile(file || undefined);
          setEntity(suggestionEntity);
        })
        .catch(e => {
          throw e;
        });
    }
  }, [showSidepanel, suggestion]);

  useEffect(() => {
    if (showSidepanel && pdfFile?.extractedMetadata && suggestion) {
      setHighlights(
        selectionHandlers.getHighlightsFromFile(
          pdfFile.extractedMetadata,
          suggestion.propertyName,
          HighlightColors.CURRENT
        )
      );
    }
  }, [pdfFile, setHighlights, showSidepanel, suggestion]);

  const templateId = suggestion?.entityTemplateId;
  const template = templates.find(t => t._id.toString() === templateId);

  const handleClose = () => {
    setPdfFile(undefined);
    setEntity(undefined);
    setShowSidepanel(false);
    setSelectAndSearch(false);
    setSelectedText(undefined);
    setSelectionError(undefined);
    setHighlights(undefined);
  };

  const formContext = useForm({
    values: {
      field: getFormValue(suggestion, entity, property?.type),
    },
  });

  const { isSubmitting, isDirty } = formContext.formState;
  const { handleSubmit, setValue } = formContext;

  const onSubmit = async (value: {
    field: PropertyValueSchema | PropertyValueSchema[] | undefined;
  }) => {
    const savedEntity = await handleEntitySave(
      { ...entity, __extractedMetadata: { fileID: pdfFile?._id, selections } },
      property,
      value.field,
      template,
      isDirty
    );

    if (savedEntity instanceof FetchResponseError) {
      const details = (savedEntity as FetchResponseError)?.json.prettyMessage;

      setNotifications({ type: 'error', text: 'An error occurred', details });
    } else if (savedEntity) {
      if (savedEntity) {
        setEntity(savedEntity);
        onEntitySave();
      }

      setNotifications({ type: 'success', text: 'Saved successfully.' });
    }

    handleClose();
  };

  // eslint-disable-next-line max-statements
  const handleClickToFill = async () => {
    if (selectedText) {
      if (selectedText.selectionRectangles) {
        const normalizedSelections = selectionHandlers.adjustSelectionsToScale(
          selectedText,
          pdfScalingValue,
          true
        );

        setHighlights(
          selectionHandlers.getHighlightsFromSelection(normalizedSelections, HighlightColors.NEW)
        );
        setSelections(
          selectionHandlers.updateFileSelection(
            { name: suggestion?.propertyName || '', id: property?._id as string },
            pdfFile?.extractedMetadata,
            normalizedSelections
          )
        );
      }

      if (property?.type === 'date' || property?.type === 'numeric') {
        const coercedValue = await coerceValue(property.type, selectedText.text, pdfFile?.language);

        if (!coercedValue?.success) {
          setSelectionError('Value cannot be transformed to the correct type');
        } else {
          const value =
            property.type === 'date' ? secondsToISODate(coercedValue.value) : coercedValue.value;
          setValue('field', value, { shouldDirty: true });
          setSelectionError(undefined);
        }
      } else {
        const sanitizedText = selectedText.text?.replace(/[\n\r]/g, ' ');
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
        {pdfFile && (
          <PDF
            fileUrl={`/api/files/${pdfFile.filename}`}
            highlights={highlights}
            onSelect={selection => {
              if (!selection.selectionRectangles.length) {
                setSelectionError('Could not detect the area for the selected text');
                setSelectedText(undefined);
              } else {
                setSelectionError(undefined);
                setSelectedText(selection);
              }
            }}
            onDeselect={() => {
              setSelectionError(undefined);
              setSelectedText(undefined);
            }}
            scrollToPage={!selectedText ? Object.keys(highlights || {})[0] : undefined}
          />
        )}
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
                        setSelections(
                          selectionHandlers.deleteFileSelection(
                            { name: suggestion?.propertyName || '' },
                            pdfFile?.extractedMetadata
                          )
                        );
                      }}
                    >
                      <Translate>Clear</Translate>
                    </Button>
                  </div>
                }
              />
            </VerticalDrawer>
            <div className="flex justify-end gap-2 px-4 py-2 border-t border-gray-200">
              <Button type="button" styling="outline" disabled={isSubmitting} onClick={handleClose}>
                <Translate>Cancel</Translate>
              </Button>
              <Button type="submit" disabled={isSubmitting} color="success">
                <Translate>Accept</Translate>
              </Button>
            </div>
          </form>
        </FormProvider>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { PDFSidepanel };
