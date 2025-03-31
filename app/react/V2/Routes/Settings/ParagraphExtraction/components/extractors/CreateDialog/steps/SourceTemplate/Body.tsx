import React from 'react';
import { MultiselectList } from 'V2/Components/UI';
import { formatTemplatesToOptions } from 'app/V2/Routes/Settings/ParagraphExtraction/utils/formatters';
import { useAtomValue } from 'jotai';
import { templatesAtom } from 'app/V2/atoms';
import { useCreateExtractorContext } from '../../CreateExtractorContext';

const Body = () => {
  const { sourceTemplateId, setSourceTemplateId, targetTemplateId } = useCreateExtractorContext();
  const templates = useAtomValue(templatesAtom);
  const sourceTemplateOptions = formatTemplatesToOptions(
    templates.filter(template => template._id !== targetTemplateId)
  );

  return (
    <div>
      <MultiselectList
        value={[sourceTemplateId]}
        items={sourceTemplateOptions}
        onChange={selected => {
          setSourceTemplateId(selected[0]);
        }}
        allowSelelectAll={false}
        singleSelect
        className="min-h-[500px]"
        itemContainerClassName="max-h-[400px] overflow-y-auto my-4"
      />
    </div>
  );
};

export { Body };
