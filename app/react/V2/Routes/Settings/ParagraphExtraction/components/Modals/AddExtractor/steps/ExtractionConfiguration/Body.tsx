import React, { useMemo } from 'react';
import { Translate } from 'app/I18N';
import { OptionSchema, Select } from 'app/V2/Components/Forms';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'app/V2/atoms';
import { TemplateSchema } from 'shared/types/templateType';
import { useAddExtractorContext } from '../../AddExtractorContext';

const Body = () => {
  const {
    targetTemplateId,
    richTextId,
    numericId,
    relationshipId,
    setRichTextId,
    setNumericId,
    setRelationshipId,
  } = useAddExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = templates.find(template => template._id === targetTemplateId);

  const getProperties = useMemo(
    () =>
      (type: TemplateSchema['type']): OptionSchema[] =>
        targetTemplate?.properties
          ? targetTemplate.properties
              .filter(property => property.type === type)
              .map(property => ({
                key: property._id?.toString(),
                value: property._id?.toString() ?? '',
                label: property.label,
              }))
          : [],
    [targetTemplate]
  );

  const getOptions = (options: OptionSchema[], setValue: (value: string) => void) => {
    if (options.length === 1) {
      setValue(options[0].value);
      return options;
    }

    return [
      {
        key: `select-${Math.random().toString()}`,
        value: '',
        label: 'Select...',
      },
      ...options,
    ];
  };

  const richTextProperties = useMemo(() => getProperties('markdown'), [getProperties]);
  const numericProperties = useMemo(() => getProperties('numeric'), [getProperties]);
  const relationships = useMemo(() => getProperties('relationship'), [getProperties]);

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
          value={richTextId}
          options={getOptions(richTextProperties, setRichTextId)}
          onChange={evt => {
            setRichTextId(evt.target.value);
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
          value={numericId}
          options={getOptions(numericProperties, setNumericId)}
          onChange={evt => {
            setNumericId(evt.target.value);
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
          options={getOptions(relationships, setRelationshipId)}
          onChange={evt => {
            setRelationshipId(evt.target.value);
          }}
        />
      </div>
    </div>
  );
};

export { Body };
