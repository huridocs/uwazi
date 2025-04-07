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
    targetRelationshipId,
    sourceRelationshipId,
    setParagraphPropertyId,
    setParagraphNumberPropertyId,
    setTargetRelationshipId,
    setSourceRelationshipId,
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
    <div className="flex flex-col gap-4 min-h-[400px] my-4">
      <div>
        <Select
          id="rich-text-property"
          label={
            <Translate className="text-sm font-semibold text-gray-900">
              Paragraph text extraction property (rich text)
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
              Paragraph text extraction property (numeric text)
            </Translate>
          }
          value={paragraphNumberPropertyId}
          options={getOptions(numericProperties)}
          onChange={evt => {
            setParagraphNumberPropertyId(evt.target.value);
          }}
        />
      </div>
      <hr className="self-center w-5 my-4 border-t-2 border-gray-200" />
      <div>
        <Select
          id="target-relationship-type"
          label={
            <Translate className="text-sm font-semibold text-gray-900">
              Target relationship type
            </Translate>
          }
          value={targetRelationshipId}
          options={getOptions(relationships)}
          onChange={evt => {
            setTargetRelationshipId(evt.target.value);
          }}
        />
      </div>
      <div>
        <Select
          id="source-relationship-type"
          label={
            <Translate className="text-sm font-semibold text-gray-900">
              Source relationship type
            </Translate>
          }
          value={sourceRelationshipId}
          options={getOptions(relationships)}
          onChange={evt => {
            setSourceRelationshipId(evt.target.value);
          }}
        />
      </div>
    </div>
  );
};

export { Body };
