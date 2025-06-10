import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { t, Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema, ClientProperty } from 'V2/shared/types';
import { propertyIcons } from 'V2/Components/UI/Icons';
import {
  PropertyTypeField,
  LabelField,
  HideLabelField,
  RequiredField,
  ShowInCardsField,
  DefaultFilterField,
  PrioritySortingField,
  FilterField,
  StyleField,
} from './fields';
import { ThesaurusField } from './fields/ThesaurusField';
import { RelationshipFields } from './fields/RelationshipFields';
import { MatchingPropertiesTable } from './MatchingPropertiesTable';
import { translationsKeys } from '../helpers';
import { PropertyRow } from '../types';
import { GeneratedIdField } from './fields/GeneratedIdField';

interface ConfigPropertyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyConfig: any) => void;
  template: ClientTemplateSchema;
  propertyToEdit?: PropertyRow;
}

const emptyProperty = {
  type: 'text',
  label: 'Text',
  hideLabel: false,
  required: false,
  showInCards: false,
  filter: false,
  defaultFilter: false,
  prioritySorting: false,
  style: undefined,
  content: undefined,
  relationType: undefined,
  inherit: undefined,
  generatedId: false,
};

const filterableTypes = [
  'text',
  'numeric',
  'select',
  'relationship',
  'multiselect',
  'date',
  'daterange',
  'multidate',
  'multidaterange',
  'markdown',
  'generatedid',
];

const prioritySortingTypes = ['text', 'numeric', 'select', 'date'];

export const ConfigPropertyPanel: React.FC<ConfigPropertyPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
  propertyToEdit,
}) => {
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ClientProperty>({
    defaultValues: propertyToEdit
      ? {
          type: propertyToEdit.type,
          label: propertyToEdit.label || '',
          hideLabel: propertyToEdit.noLabel,
          required: propertyToEdit.required,
          showInCards: propertyToEdit.showInCard,
          filter: propertyToEdit.filter,
          defaultFilter: propertyToEdit.defaultfilter,
          prioritySorting: propertyToEdit.prioritySorting,
          style: propertyToEdit.style,
          content: propertyToEdit.content,
          relationType: propertyToEdit.relationType,
          inherit: propertyToEdit.inherit,
          generatedId: propertyToEdit.generatedId,
        }
      : { ...emptyProperty },
  });

  const type = watch('type');
  const filter = watch('filter');
  const isCommonProperty = propertyToEdit?.isCommonProperty;
  const isTitleProperty = propertyToEdit?.name === 'title';

  const isSelectOrMultiselect = type === 'select' || type === 'multiselect';
  const isImageOrPreview = type === 'image' || type === 'preview';
  const isRelationship = type === 'relationship';

  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (!propertyToEdit) {
      reset({ ...emptyProperty, type, label: type.charAt(0).toUpperCase() + type.slice(1) });
      if (type === 'image' || type === 'preview') {
        setValue('style', 'fill');
      }
    }
    if (propertyToEdit) {
      reset(propertyToEdit);
    }
  }, [type, setValue, propertyToEdit, reset]);

  useEffect(() => {
    if (!isOpen) {
      reset(emptyProperty);
    }
  }, [reset, isOpen]);

  useEffect(() => {
    // Reset defaultFilter and prioritySorting when filter changes
    setValue('defaultFilter', false);
    setValue('prioritySorting', false);
  }, [filter, setValue]);

  const submitForm = (data: any) => {
    //check for any errors
    if (Object.keys(errors).length > 0) {
      return;
    }
    onSubmit({
      type: data.type,
      label: data.label,
      noLabel: data.hideLabel,
      required: data.required,
      showInCard: data.showInCards,
      filter: data.filter,
      defaultfilter: data.defaultFilter,
      prioritySorting: data.prioritySorting,
      style: data.style,
      content: data.content,
      relationType: data.relationType,
      inherit: data.inherit,
      generatedId: data.generatedId,
    });
    onClose();
  };

  return (
    <Sidepanel
      isOpen={isOpen}
      withOverlay
      size="large"
      title={<Translate>{propertyToEdit ? 'Edit property' : 'New property'}</Translate>}
      closeSidepanelFunction={onClose}
    >
      <form onSubmit={handleSubmit(submitForm)} className="flex flex-col h-full">
        <Sidepanel.Body>
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              {propertyToEdit ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-gray-700">
                    <Translate>Type</Translate>
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 w-full">
                    <span className="w-5 h-5 text-gray-500">
                      {propertyIcons[type as keyof typeof propertyIcons]}
                    </span>
                    <span className="text-sm text-gray-700">
                      {t(
                        'System',
                        translationsKeys[type as keyof typeof translationsKeys] || type,
                        null,
                        false
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <PropertyTypeField control={control} />
              )}
              <LabelField
                register={register}
                errors={errors}
                template={template}
                propertyToEdit={propertyToEdit}
              />
              {isImageOrPreview && <StyleField control={control} />}
              {isSelectOrMultiselect && <ThesaurusField control={control} />}
              {isRelationship && <RelationshipFields control={control} templateId={template._id} />}
              <div className="flex flex-col gap-2 mt-2">
                {!isCommonProperty && <HideLabelField control={control} />}
                {!isCommonProperty && <RequiredField control={control} />}
                {!isCommonProperty && <ShowInCardsField control={control} />}
                {!isCommonProperty && filterableTypes.includes(type) && (
                  <>
                    <FilterField control={control} />
                    {filter && (
                      <>
                        <DefaultFilterField control={control} />
                        {prioritySortingTypes.includes(type) && (
                          <PrioritySortingField control={control} />
                        )}
                      </>
                    )}
                  </>
                )}
                {isCommonProperty && <PrioritySortingField control={control} />}
                {isCommonProperty && isTitleProperty && <GeneratedIdField control={control} />}
              </div>
            </div>
            {!isCommonProperty && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  <Translate>
                    Properties from other templates in the collection using the same label.
                  </Translate>
                </h3>
                <MatchingPropertiesTable
                  label={watch('label')}
                  type={watch('type') as PropertyTypeSchema}
                  template={template}
                  content={watch('content')}
                  relationType={watch('relationType')}
                  inherit={watch('inherit')}
                />
              </div>
            )}
          </div>
        </Sidepanel.Body>
        <Sidepanel.Footer className="flex justify-end gap-2 p-4 border-t">
          <Button type="button" styling="outline" onClick={onClose}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" color="success">
            <Translate>{propertyToEdit ? 'Save changes' : 'Add property'}</Translate>
          </Button>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};
