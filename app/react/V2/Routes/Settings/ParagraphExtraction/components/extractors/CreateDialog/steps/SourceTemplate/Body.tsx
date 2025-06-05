import React from 'react';
import { MultiselectList } from 'V2/Components/UI';
import { formatTemplatesToOptions } from 'app/V2/Routes/Settings/ParagraphExtraction/utils/formatters';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'app/V2/atoms';
import { useLoaderData } from 'react-router';
import { Extractor } from 'app/V2/shared/ParagraphExtractionTypes';
import { useCreateExtractorContext } from '../../CreateExtractorContext';

const Body = () => {
  const { extractors = [] } = useLoaderData() as {
    extractors: Extractor[];
  };
  const { sourceTemplateId, setSourceTemplateId, targetTemplateId } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const sourceTemplateOptions = formatTemplatesToOptions(
    templates
      .filter(template => template._id !== targetTemplateId)
      .filter(
        template => !extractors.some(extractor => extractor.sourceTemplateId === template._id)
      )
  );

  return (
    <div>
      <MultiselectList
        selectedValues={[sourceTemplateId]}
        items={sourceTemplateOptions}
        onChange={selected => {
          setSourceTemplateId(selected[0]);
        }}
        allowSelelectAll={false}
        singleSelect
        className="min-h-[400px]"
        hideFilters
        itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
      />
    </div>
  );
};

export { Body };
