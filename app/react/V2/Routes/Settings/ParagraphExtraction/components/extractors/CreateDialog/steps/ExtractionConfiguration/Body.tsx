import React, { useMemo } from 'react';
import { Translate } from 'app/I18N';
import { OptionSchema, Select } from 'app/V2/Components/Forms';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom, templatesAtom } from 'app/V2/atoms';
import { TemplateSchema } from 'shared/types/templateType';
import { useCreateExtractorContext } from '../../CreateExtractorContext';

const getOptions = (options: OptionSchema[]) => [
  {
    key: `select-${Math.random().toString()}`,
    value: '',
    label: 'Select...',
  },
  ...options,
];

const getTemplateProperties = (
  type: TemplateSchema['type'],
  targetTemplate?: TemplateSchema
): OptionSchema[] =>
  targetTemplate?.properties
    ? targetTemplate.properties
        .filter(property => property.type === type)
        .map(property => ({
          key: property._id?.toString(),
          value: property._id?.toString() ?? '',
          label: property.label,
        }))
    : [];

const Body = () => {
  const {
    targetTemplateId,
    paragraphPropertyId,
    paragraphNumberPropertyId,
    relationshipId,
    setParagraphPropertyId,
    setParagraphNumberPropertyId,
    setRelationshipId,
  } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const relationTypes = useAtomValue(relationshipTypesAtom);
  const targetTemplate = templates.find(template => template._id === targetTemplateId);

  const richTextProperties = useMemo(
    () => getTemplateProperties('markdown', targetTemplate),
    [targetTemplate]
  );
  const numericProperties = useMemo(
    () => getTemplateProperties('numeric', targetTemplate),
    [targetTemplate]
  );
  const relationships = useMemo(
    () =>
      relationTypes.map(relation => ({
        key: relation._id,
        value: relation._id,
        label: relation.name,
      })),
    [relationTypes]
  );

  return (
    <div className="flex flex-col gap-4 min-h-[500px] my-4">
      <div>
        <Select
          id="rich-text-property"
          label={
            <Translate className="text-sm font-semibold text-gray-900">
              Paragraph text extraction property (rich text):
            </Translate>
          }
          value={paragraphPropertyId}
          options={getOptions(richTextProperties)}
          onChange={evt => {
            setParagraphPropertyId(evt.target.value);
          }}
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
          value={paragraphNumberPropertyId}
          options={getOptions(numericProperties)}
          onChange={evt => {
            setParagraphNumberPropertyId(evt.target.value);
          }}
        />
      </div>
      <hr className="w-5 self-center my-4 border-t-2 border-gray-200" />
      <div>
        <Select
          id="relationship-type"
          label={
            <Translate className="text-sm font-semibold text-gray-900">
              Relationship type:
            </Translate>
          }
          value={relationshipId}
          options={getOptions(relationships)}
          onChange={evt => {
            setRelationshipId(evt.target.value);
          }}
        />
      </div>
    </div>
  );
};

export { Body };
