import React from 'react';
import { useForm } from 'react-hook-form';
import { Sidepanel } from 'V2/Components/UI/Sidepanel';
import { Translate } from 'app/I18N';
import { Button } from 'V2/Components/UI/Button';
import { PropertyTypeSchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema, ClientProperty } from 'V2/shared/types';
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
import { MatchingPropertiesTable } from './MatchingPropertiesTable';

interface ConfigPropertyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (propertyConfig: any) => void;
  template: ClientTemplateSchema;
}

export const ConfigPropertyPanel: React.FC<ConfigPropertyPanelProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
}) => {
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ClientProperty>({
    defaultValues: {
      propertyType: 'text',
      label: '',
      hideLabel: false,
      required: false,
      showInCards: false,
      filter: false,
      defaultFilter: false,
      prioritySorting: false,
      style: undefined,
    },
  });

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

  const propertyType = watch('propertyType');
  const filter = watch('filter');

  React.useEffect(() => {
    // Reset all options when propertyType changes
    setValue('hideLabel', false);
    setValue('required', false);
    setValue('showInCards', false);
    setValue('filter', false);
    setValue('defaultFilter', false);
    setValue('prioritySorting', false);
    if (propertyType === 'image' || propertyType === 'preview') {
      setValue('style', 'fill');
    } else {
      setValue('style', undefined);
    }
  }, [propertyType, setValue]);

  React.useEffect(() => {
    // Reset defaultFilter and prioritySorting when filter changes
    setValue('defaultFilter', false);
    setValue('prioritySorting', false);
  }, [filter, setValue]);

  React.useEffect(() => {}, [propertyType, setValue]);

  const submitForm = (data: any) => {
    onSubmit({
      type: data.propertyType,
      label: data.label,
      noLabel: data.hideLabel,
      required: data.required,
      showInCard: data.showInCards,
      filter: data.filter,
      defaultfilter: data.defaultFilter,
      prioritySorting: data.prioritySorting,
      style: data.style,
    });
  };

  return (
    <Sidepanel
      isOpen={isOpen}
      withOverlay
      size="large"
      title={<Translate>New property</Translate>}
      closeSidepanelFunction={onClose}
    >
      <form onSubmit={handleSubmit(submitForm)} className="flex flex-col h-full">
        <Sidepanel.Body>
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <PropertyTypeField control={control} />
              <LabelField register={register} errors={errors} />

              <div className="flex flex-col gap-2 mt-2">
                <HideLabelField control={control} />
                <RequiredField control={control} />
                <ShowInCardsField control={control} />
                {filterableTypes.includes(propertyType) && (
                  <>
                    <FilterField control={control} />
                    {filter && (
                      <>
                        <DefaultFilterField control={control} />
                        {prioritySortingTypes.includes(propertyType) && (
                          <PrioritySortingField control={control} />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
              {(propertyType === 'image' || propertyType === 'preview') && (
                <StyleField control={control} />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                <Translate>
                  Properties from other templates in the collection using the same label.
                </Translate>
              </h3>
              <MatchingPropertiesTable
                label={watch('label')}
                type={watch('propertyType') as PropertyTypeSchema}
                template={template}
              />
            </div>
          </div>
        </Sidepanel.Body>
        <Sidepanel.Footer className="flex justify-end gap-2 p-4 border-t">
          <Button type="button" styling="outline" onClick={onClose}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" color="success">
            <Translate>Add property</Translate>
          </Button>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};
