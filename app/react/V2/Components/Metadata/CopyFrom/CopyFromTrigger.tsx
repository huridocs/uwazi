import React, { useState } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { CopyFromModal } from './CopyFromModal.js';

type CopyFromTriggerProps = {
  disabled?: boolean;
};

const CopyFromTrigger = ({ disabled = false }: CopyFromTriggerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="warm"
        className="inline-flex items-center"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <DocumentDuplicateIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />
        <Translate>Copy from...</Translate>
      </Button>
      {open ? <CopyFromModal onClose={() => setOpen(false)} /> : null}
    </>
  );
};

export { CopyFromTrigger };
export type { CopyFromTriggerProps };
