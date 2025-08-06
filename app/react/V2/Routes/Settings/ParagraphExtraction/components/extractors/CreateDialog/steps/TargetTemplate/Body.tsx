import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { defaultSearch, MultiselectList, MultiselectListOption } from 'V2/Components/Forms';
import { useCreateExtractorContext } from '../../CreateExtractorContext';
import { filterPXQualifiedTemplates } from '../../../../../utils/filterPXQualifiedTemplates';
import { formatTemplatesToOptions } from '../../../../../utils/formatters';

const Body = () => {
  const { targetTemplateId, setTargetTemplateId } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const targetTemplateOptions = formatTemplatesToOptions(
    templates.filter(filterPXQualifiedTemplates)
  );
  const [options, setOptions] = useState<MultiselectListOption[]>(targetTemplateOptions);
  return (
    <div>
      <MultiselectList
        selectedValues={[targetTemplateId]}
        items={options}
        onChange={selected => {
          setTargetTemplateId(selected[0]);
        }}
        onSearch={s => setOptions(() => defaultSearch(s, targetTemplateOptions))}
        singleSelect
        className="min-h-[400px]"
        hideFilters
        itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
      />
    </div>
  );
};

export { Body };
