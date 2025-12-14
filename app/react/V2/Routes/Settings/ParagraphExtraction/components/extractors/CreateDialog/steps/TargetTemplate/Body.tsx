import React, { useState, useEffect } from 'react';
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

  // Update options when templates change (e.g., when a new template is created)
  useEffect(() => {
    setOptions(targetTemplateOptions);
  }, [targetTemplateOptions]);

  return (
    <div className="h-96 pt-2">
      <MultiselectList
        selectedValues={[targetTemplateId]}
        items={options}
        onChange={selected => {
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
