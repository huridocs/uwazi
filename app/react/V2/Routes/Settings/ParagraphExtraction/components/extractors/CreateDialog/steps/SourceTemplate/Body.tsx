import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { useLoaderData } from 'react-router';
import { formatTemplatesToOptions } from '#V2/Routes/Settings/ParagraphExtraction/utils/formatters.js';
import {
  MultiselectListOption,
  MultiselectList,
  defaultSearch,
} from '#V2/Components/Forms/index.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';
import { useCreateExtractorContext } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/CreateExtractorContext.js';

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
  const [options, setOptions] = useState<MultiselectListOption[]>(sourceTemplateOptions);

  return (
    <div className="h-96 pt-2">
      <MultiselectList
        selectedValues={[sourceTemplateId]}
        items={options}
        onChange={(selected: any) => {
          setSourceTemplateId(selected[0]);
        }}
        onSearch={s => setOptions(() => defaultSearch(s, sourceTemplateOptions))}
        allowSelelectAll={false}
        singleSelect
        hideFilters
      />
    </div>
  );
};

export { Body };
