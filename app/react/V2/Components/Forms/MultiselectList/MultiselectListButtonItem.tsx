import React from 'react';
import { Translate } from 'app/I18N';
import { MultiselectListOption } from './MultiselectList';
import { Pill } from '../../UI/Pill';

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
  const borderSyles = selected
    ? 'border-success-200'
    : 'border-transparent hover:border-primary-300';

  return (
    <li key={item.value} className={`${itemClassName ?? 'bg-gray-50 rounded-lg mb-4'}`}>
      <button
        type="button"
        className={`w-full flex text-left p-2.5 border ${borderSyles} rounded-lg items-center`}
        onClick={onClick}
      >
        <span className="flex-1">{item.label}</span>
        <div className="flex-1">
          <Pill className="float-right" color={selected ? 'green' : 'primary'}>
            {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
          </Pill>
        </div>
      </button>
    </li>
  );
};

export { MultiselectListButtonItem };
