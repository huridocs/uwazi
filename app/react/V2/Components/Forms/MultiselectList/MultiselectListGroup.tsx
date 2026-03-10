import React from 'react';
import { Translate } from 'app/I18N';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface MultiselectListButtonItemProps {
  children: React.ReactNode;
  isOpen: boolean;
  foldable: boolean;
  label: string | React.ReactNode;
  itemContainerClassName?: string;
  itemClassName?: string;
  onClick: () => void;
}

const MultiselectListGroup = ({
  children,
  isOpen,
  foldable,
  label,
  onClick,
  itemContainerClassName,
  itemClassName,
}: MultiselectListButtonItemProps) => {
  if (foldable) {
    return (
      <li className={`${itemClassName ?? 'bg-gray-50 rounded-lg mb-4'}`}>
        <div
          className={`flex justify-between p-3 mb-4 rounded-lg ${isOpen ? 'bg-indigo-50' : 'bg-gray-50'}`}
          onClick={onClick}
        >
          <span className="block text-sm font-bold text-gray-900">{label}</span>
          <button
            className="text-indigo-800 bg-indigo-200 rounded-[6px] text-xs font-medium px-1.5 py-0.5 flex flex-row items-center justify-center gap-1"
            type="button"
          >
            <div className="w-3 h-3 text-sm">
              {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
            <Translate>Group</Translate>
          </button>
        </div>
        {isOpen && <ul className={`${itemContainerClassName ?? 'pl-4 '}`}>{children}</ul>}
      </li>
    );
  }

  return (
    <li className={`${itemClassName ?? 'bg-gray-50 rounded-lg mb-4'}`}>
      <span className="block mb-4 text-sm font-bold text-gray-900">{label}</span>
      <ul className={`${itemContainerClassName ?? ''}`}>{children}</ul>
    </li>
  );
};

export { MultiselectListGroup };
