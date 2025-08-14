/* eslint-disable max-lines */
import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { t, Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema, ClientProperty } from 'V2/shared/types';
import { propertyIcons } from 'V2/Components/UI/Icons';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
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
  FullWidthField,
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
  noLabel: false,
  required: false,
  showInCard: false,
  filter: false,
  defaultfilter: false,
  prioritySorting: false,
  style: '',
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
  'nested',
];

const prioritySortingTypes = ['text', 'numeric', 'select', 'date'];
const fullWidthTypes = ['image', 'preview', 'media'];

export const ConfigPropertyPanel: React.FC<ConfigPropertyPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
  propertyToEdit,
}) => {
  const templates = useAtomValue(templatesAtom);
  const form = useForm<ClientProperty>({
    defaultValues: propertyToEdit
      ? {
          type: propertyToEdit.type,
          label: propertyToEdit.label || '',
          noLabel: propertyToEdit.noLabel || false,
          required: propertyToEdit.required || false,
          showInCard: propertyToEdit.showInCard || false,
          filter: propertyToEdit.filter || false,
          defaultfilter: propertyToEdit.defaultfilter || false,
          prioritySorting: propertyToEdit.prioritySorting || false,
          style: propertyToEdit.style || '',
          content: propertyToEdit.content || '',
          relationType: propertyToEdit.relationType || '',
          inherit: propertyToEdit.inherit,
          generatedId: propertyToEdit.generatedId || false,
        }
      : { ...emptyProperty },
  });

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = form;

  const type = watch('type');
  const filter = watch('filter');
  const label = watch('label');
  const content = watch('content');
  const relationType = watch('relationType');
  const inherit = watch('inherit');
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
      if (type === 'relationship') {
        setValue('relationType', '');
        setValue('content', '');
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
    if (!filter && !isCommonProperty) {
      setValue('defaultfilter', false);
      setValue('prioritySorting', false);
    }
  }, [filter, setValue, isCommonProperty]);

  // eslint-disable-next-line max-statements
  const validateMatchingProperties = () => {
    const lowerLabel = label.trim().toLowerCase();

    const matchingProperties = templates.flatMap((templ: ClientTemplateSchema) =>
      [...(templ.properties || [])]
        .filter((prop: ClientProperty) => prop.label?.trim().toLowerCase() === lowerLabel)
        .filter((prop: ClientProperty) => prop._id !== propertyToEdit?._id)
    );

    if (matchingProperties.length === 0) {
      return true;
    }

    const hasTypeMismatch = matchingProperties.some((prop: ClientProperty) => prop.type !== type);
    if (hasTypeMismatch) {
      return false;
    }

    if (type === 'select' || type === 'multiselect') {
      const hasContentMismatch = matchingProperties.some(
        (prop: ClientProperty) => prop.content !== content
      );
      if (hasContentMismatch) {
        return false;
      }
    }

    if (type === 'relationship') {
      const hasRelationshipMismatch = matchingProperties.some(
        (prop: ClientProperty) =>
          prop.content !== content ||
          prop.relationType !== relationType ||
          JSON.stringify(prop.inherit) !== JSON.stringify(inherit)
      );
      if (hasRelationshipMismatch) {
        return false;
      }
    }

    return true;
  };

  const submitForm = (data: ClientProperty) => {
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (validateMatchingProperties()) {
      onSubmit(data);
      onClose();
    }
  };

  return (
    <Sidepanel
      isOpen={isOpen}
      withOverlay
      size="large"
      title={
        <Translate className="uppercase">
          {propertyToEdit ? 'Edit property' : 'New property'}
        </Translate>
      }
      closeSidepanelFunction={onClose}
    >
      <FormProvider {...form}>
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
                {isRelationship && (
                  <RelationshipFields control={control} templateId={template._id} />
                )}
                <div className="flex flex-col gap-2 mt-2">
                  {fullWidthTypes.includes(type) && <FullWidthField control={control} />}
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
                    label={label}
                    type={type as PropertyTypeSchema}
                    template={template}
                    content={content}
                    relationType={relationType}
                    inherit={inherit}
                    _id={propertyToEdit?._id}
                  />
                </div>
              )}
            </div>
          </Sidepanel.Body>
          <Sidepanel.Footer className="flex justify-end gap-2 p-4 border-t">
            <Button type="button" styling="outline" onClick={onClose}>
              <Translate>Cancel</Translate>
            </Button>
            <Button type="submit" color="success" disabled={!validateMatchingProperties()}>
              <Translate>{propertyToEdit ? 'Save' : 'Add property'}</Translate>
            </Button>
          </Sidepanel.Footer>
        </form>
      </FormProvider>
    </Sidepanel>
  );
};
