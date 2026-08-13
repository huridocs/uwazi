import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { MultiselectListOption } from './MultiselectList.js';
import { Pill } from '../../UI/Pill.js';

interface MultiselectListButtonItemProps {
  item: MultiselectListOption;
  selected: boolean;
  itemClassName?: string;
  onClick: () => void;
}

const MultiselectListButtonItem = ({
  item,
  selected,
  onClick,
  itemClassName,
}: MultiselectListButtonItemProps) => {
  const borderStyles = selected
    ? 'border-success-200'
    : 'border-transparent hover:border-primary-300';

  return (
    <li key={item.value} className={`${itemClassName ?? 'mb-1.5 rounded-md bg-warm'}`}>
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-md border p-2 text-left ${borderStyles}`}
        onClick={onClick}
      >
        <span className="min-w-0 flex-1">{item.label}</span>
        <Pill color={selected ? 'green' : 'primary'}>
          {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
        </Pill>
      </button>
    </li>
  );
};

export { MultiselectListButtonItem };
