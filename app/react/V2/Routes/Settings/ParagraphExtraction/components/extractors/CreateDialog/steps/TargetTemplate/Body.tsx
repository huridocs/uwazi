import React from 'react';
import { MultiselectList } from 'V2/Components/UI';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'V2/atoms';
import { useCreateExtractorContext } from '../../CreateExtractorContext';
import { filterPXQualifiedTemplates } from '../../../../../utils/filterPXQualifiedTemplates';
import { formatTemplatesToOptions } from '../../../../../utils/formatters';

const Body = () => {
  const { targetTemplateId, setTargetTemplateId } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const targetTemplateOptions = formatTemplatesToOptions(
    templates.filter(filterPXQualifiedTemplates)
  );
  return (
    <div>
      <MultiselectList
        value={[targetTemplateId]}
        items={targetTemplateOptions}
        onChange={selected => {
          setTargetTemplateId(selected[0]);
        }}
        singleSelect
        className="min-h-[400px]"
        hideFilters
        itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
      />
    </div>
  );
};

export { Body };
