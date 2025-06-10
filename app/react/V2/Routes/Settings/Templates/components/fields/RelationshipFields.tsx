import React, { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
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

  const relationshipTypeOptions = useMemo(
    () =>
      orderBy(
        relationshipTypes.map(type => ({
          value: type._id,
          label: t(type._id, type.name, null, false),
        })),
        'label'
      ),
    [relationshipTypes]
  );

  const entityOptions = useMemo(() => {
    const options = orderBy(
      templates
        .filter(template => template._id !== templateId)
        .map(template => ({
          value: template._id,
          label: t(template._id, template.name, null, false),
        })),
      'label'
    );

    options.unshift({ value: 'any', label: t('System', 'Any entity', null, false) });
    return options;
  }, [templates, templateId]);

  const selectedTemplate = useMemo(() => {
    if (content === 'any') return null;
    return templates.find(template => template._id === content);
  }, [content, templates]);

  const propertyOptions = useMemo(() => {
    if (!selectedTemplate?.properties) return [];
    const options: { value: string; label: string; type?: string }[] = orderBy(
      selectedTemplate.properties.map(prop => ({
        value: String(prop._id || ''),
        label: t(String(prop._id || ''), prop.label, null, false),
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
        rules={{ required: true }}
        render={({ field }) => (
          <Select
            id="property-entity"
            label={
              <div className="flex items-center gap-1">
                <Translate>Entities</Translate>
                <span>*</span>
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
                  field.onChange(undefined);
                }
              }}
              value={field.value?.property}
            />
          )}
        />
      )}
    </div>
  );
};
