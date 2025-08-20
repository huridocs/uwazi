/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useEffect } from 'react';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { Select } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { relationshipTypesAtom, templatesAtom } from 'V2/atoms';
import { orderBy } from 'lodash';

interface RelationshipFieldsProps {
  control: any;
  disabled?: boolean;
  templateId: string;
}

export const RelationshipFields = ({ control, disabled, templateId }: RelationshipFieldsProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const content = useWatch({ control, name: 'content' });
  const { setValue } = useFormContext();

  useEffect(() => {
    setValue('inherit', undefined);
  }, [content, setValue]);

  const relationshipTypeOptions = useMemo(() => {
    const options = orderBy(
      relationshipTypes.map(type => ({
        value: type._id,
        label: t(type._id, type.name, null, false),
      })),
      'label'
    );
    options.unshift({ value: '', label: t('System', 'Select...', null, false) });
    return options;
  }, [relationshipTypes]);

  const entityOptions = useMemo(() => {
    const options = orderBy(
      templates
        .filter(template => template._id !== templateId)
        .map(template => {
          const name =
            template.name.length > 30 ? `${template.name.slice(0, 30)}...` : template.name;
          const translatedName = t(template._id, template.name, null, false, 30);

          const label = `${name === translatedName ? name : `${name} (${translatedName})`}`;
          return {
            value: template._id,
            label,
          };
        }),
      'label'
    );

    options.unshift({ value: '', label: t('System', 'Any entity', null, false) });
    return options;
  }, [templates, templateId]);

  const selectedTemplate = useMemo(() => {
    if (content === '') return null;
    return templates.find(template => template._id === content);
  }, [content, templates]);

  const propertyOptions = useMemo(() => {
    if (!selectedTemplate?.properties) return [];
    const options: { value: string; label: string; type?: string }[] = orderBy(
      selectedTemplate.properties.map(prop => ({
        value: String(prop._id || ''),
        label: t(selectedTemplate._id, prop.label, null, false, 100),
        type: prop.type,
      })),
      'label'
    );

    options.unshift({ value: '', label: t('System', 'Select...', null, false), type: undefined });
    return options;
  }, [selectedTemplate]);

  return (
    <div className="flex flex-col gap-4">
      <Controller
        name="relationType"
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <Select
            id="property-relation-type"
            label={
              <div className="flex items-center gap-1">
                <Translate>Relationship type</Translate>
                <span>*</span>
              </div>
            }
            options={relationshipTypeOptions}
            disabled={disabled}
            {...field}
          />
        )}
      />

      <Controller
        name="content"
        control={control}
        rules={{ required: false }}
        render={({ field }) => (
          <Select
            id="property-entity"
            label={
              <div className="flex items-center gap-1">
                <Translate>Entities</Translate>
              </div>
            }
            options={entityOptions}
            disabled={disabled}
            {...field}
          />
        )}
      />

      {selectedTemplate && (
        <Controller
          name="inherit"
          control={control}
          render={({ field }) => (
            <Select
              id="property-inherit"
              label={<Translate>Inherit property</Translate>}
              options={propertyOptions}
              disabled={disabled}
              onChange={e => {
                const { value } = e.target;
                const option = propertyOptions.find(opt => opt.value === value);
                if (option && option.type) {
                  field.onChange({ property: value, type: option.type });
                } else {
                  field.onChange('');
                }
              }}
              value={field.value?.property || ''}
            />
          )}
        />
      )}
    </div>
  );
};
