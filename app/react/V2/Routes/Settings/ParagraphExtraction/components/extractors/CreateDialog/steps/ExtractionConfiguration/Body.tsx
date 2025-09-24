import React, { useMemo } from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { OptionSchema, Select } from '../../V2/Components/Forms.js';
import { useAtomValue } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { relationshipTypesAtom, templatesAtom } from '../../V2/atoms.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/templateTyp... Remove this comment to see the full error message
import { TemplateSchema } from 'shared/types/templateType.js';
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
        // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
        .filter(property => property.type === type)
        // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
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
  // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
          // @ts-expect-error TS(7006): Parameter 'evt' implicitly has an 'any' type.
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
              Paragrap number extraction property (numeric)
            </Translate>
          }
          value={paragraphNumberPropertyId}
          options={getOptions(numericProperties)}
          // @ts-expect-error TS(7006): Parameter 'evt' implicitly has an 'any' type.
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
            <div className="flex flex-col gap-1">
              <Translate className="text-sm font-semibold text-gray-900">
                Target relationship type
              </Translate>
              <Translate className="text-sm font-light text-gray-500">
                Target's role in the relationship Source-Target.
              </Translate>
            </div>
          }
          value={targetRelationshipId}
          options={getOptions(
            // @ts-expect-error TS(7006): Parameter 'relation' implicitly has an 'any' type.
            relationships.filter(relation => relation.value !== sourceRelationshipId)
          )}
          // @ts-expect-error TS(7006): Parameter 'evt' implicitly has an 'any' type.
          onChange={evt => {
            setTargetRelationshipId(evt.target.value);
          }}
        />
      </div>
      <div>
        <Select
          id="source-relationship-type"
          label={
            <div className="flex flex-col gap-1">
              <Translate className="text-sm font-semibold text-gray-900">
                Source relationship type
              </Translate>
              <Translate className="text-sm font-light text-gray-500">
                Source's role in the relationship Source-Target.
              </Translate>
            </div>
          }
          value={sourceRelationshipId}
          options={getOptions(
            // @ts-expect-error TS(7006): Parameter 'relation' implicitly has an 'any' type.
            relationships.filter(relation => relation.value !== targetRelationshipId)
          )}
          // @ts-expect-error TS(7006): Parameter 'evt' implicitly has an 'any' type.
          onChange={evt => {
            setSourceRelationshipId(evt.target.value);
          }}
        />
      </div>
    </div>
  );
};

export { Body };
