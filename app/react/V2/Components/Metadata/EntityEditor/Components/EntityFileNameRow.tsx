import React, { useEffect, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { notify } from '#V2/utils/notifyBridge.js';

type EntityFileNameRowProps = {
  id: string;
  originalname?: string;
  disabled: boolean;
  hideLabel?: boolean;
  className?: string;
  onRename: (name: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  trailing?: React.ReactNode;
};

const notifyFileError = () => {
  notify(t('System', 'An error occurred', null, false), 'error');
};

const EntityFileNameRow = ({
  id,
  originalname,
  disabled,
  hideLabel = false,
  className,
  onRename,
  onRemove,
  trailing,
}: EntityFileNameRowProps) => {
  const [name, setName] = useState(originalname ?? '');

  useEffect(() => {
    setName(originalname ?? '');
  }, [id, originalname]);

  const renameOnBlur = () => {
    if (name.trim() && name !== originalname) {
      onRename(name.trim()).catch(notifyFileError);
    }
  };

  return (
    <div className="flex gap-2">
      <InputField
        id={id}
        className={className}
        label={hideLabel ? undefined : 'Name'}
        labelVariant={hideLabel ? undefined : 'secondary'}
        hideLabel={hideLabel}
        value={name}
        disabled={disabled}
        onChange={event => setName(event.target.value)}
        onBlur={renameOnBlur}
      />
      {trailing}
      {onRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onRemove().catch(notifyFileError);
          }}
          className="shrink-0 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-seal transition-colors hover:bg-seal-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Translate>Remove file</Translate>
        </button>
      ) : null}
    </div>
  );
};

export { EntityFileNameRow };
