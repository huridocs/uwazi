import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import {
  defaultSearch,
  MultiselectList,
  MultiselectListOption,
} from '#V2/Components/Forms/index.js';
import { useCreateExtractorContext } from '../../CreateExtractorContext.js';
import { filterPXQualifiedTemplates } from '../../../../../utils/filterPXQualifiedTemplates.js';
import { formatTemplatesToOptions } from '../../../../../utils/formatters.js';

const Body = () => {
  const { targetTemplateId, setTargetTemplateId } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const targetTemplateOptions = formatTemplatesToOptions(
    templates.filter(filterPXQualifiedTemplates)
  );
  const [options, setOptions] = useState<MultiselectListOption[]>(targetTemplateOptions);
  return (
    <div className="h-96 pt-2">
      <MultiselectList
        selectedValues={[targetTemplateId]}
        items={options}
        onChange={(selected: any) => {
          setTargetTemplateId(selected[0]);
        }}
        onSearch={s => setOptions(() => defaultSearch(s, targetTemplateOptions))}
        singleSelect
        hideFilters
      />
    </div>
  );
};

export { Body };
