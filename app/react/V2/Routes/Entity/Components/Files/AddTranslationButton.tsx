import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import { useEntityFiles } from './EntityFilesContext.js';

type AddTranslationButtonProps = {
  className?: string;
};

const AddTranslationButton = ({
  className = 'mt-2 inline-flex cursor-pointer items-center gap-1.5 px-1 text-xs font-medium text-ink-secondary transition-colors hover:text-ink',
}: AddTranslationButtonProps) => {
  const { requestAddFile } = useEntityFiles();

  return (
    <EntityWriteAuthorization>
      <button type="button" onClick={() => requestAddFile('translation')} className={className}>
        <PlusIcon className="h-3.5 w-3.5" aria-hidden />
        <Translate>Add translation</Translate>
      </button>
    </EntityWriteAuthorization>
  );
};

export { AddTranslationButton };
