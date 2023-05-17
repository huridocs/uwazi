import React, { useRef, useState } from 'react';
import { Checkbox } from 'flowbite-react';
import { sortBy } from 'lodash';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { useOnClickOutside } from 'V2/shared/useOnClickOutside';
import { Pill } from '../UI';

type Option = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  onChange?: (options: Option[]) => any;
}

const CONTEXT_MENU_MAX_HEIGHT = 224;

const MultiSelect = ({ label, options, onChange = () => {} }: MultiSelectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLUListElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [verticalPosition, setVerticalPosition] = useState('0px');
  const [optionsState, setOptionsState] = useState<Option[]>(sortBy(options, 'label'));

  useOnClickOutside<HTMLDivElement>(containerRef, () => setShowMenu(false));

  const selectedOptions = optionsState.filter(option => option.selected);

  return (
    <div
      className="border rounded-lg border-gray-50 relative"
      data-testid="multiselect-comp"
      ref={containerRef}
    >
      <div className="border-b border-gray-50 bg-gray-50 p-2 flex justify-between">
        <div className="text-indigo-700 text-base">{label}</div>
        <div className="left-0">
          <button
            type="button"
            className="text-indigo-700"
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              setVerticalPosition('0px');
              setShowMenu(!showMenu);
              setTimeout(() => {
                // @ts-ignore
                const box = e.target.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const contextMenu = contextMenuRef.current?.getBoundingClientRect();

                const contextMenuHeight = contextMenu
                  ? contextMenu.height
                  : CONTEXT_MENU_MAX_HEIGHT;
                const contextMenuBottom = box.bottom + contextMenuHeight;
                if (contextMenuBottom >= windowHeight) {
                  const yPosition = -contextMenuHeight;
                  setVerticalPosition(`${yPosition + box.height}px`);
                } else {
                  setVerticalPosition(`${box.height}px`);
                }
              }, 0);
            }}
          >
            <PlusCircleIcon className="text-lg w-6" />
          </button>
        </div>
      </div>

      <div className="min-h-fit p-2 flex flex-wrap">
        {selectedOptions.length ? (
          selectedOptions.map((option: Option) => (
            <Pill color="gray" key={option.value} className="mb-2 flex flex-row">
              <span className="flex items-center">{option.label}</span>
              <button
                type="button"
                className="ml-1 text-gray-400 font-bold content-center justify-center"
                onClick={() => {
                  const selected = optionsState.map(opt => {
                    if (opt.value === option.value) {
                      return { value: opt.value, label: opt.label };
                    }
                    return opt;
                  });
                  setOptionsState(selected);
                  onChange(selected);
                }}
              >
                <XMarkIcon className="text-lg w-6" />
              </button>
            </Pill>
          ))
        ) : (
          <Translate>Nothing selected</Translate>
        )}
      </div>

      {showMenu ? (
        <ul
          ref={contextMenuRef}
          style={{ top: verticalPosition || '0px' }}
          className="p-2 w-fit max-w-md rounded max-h-56 overflow-y-auto absolute right-8 shadow-md bg-white"
        >
          {optionsState.map((option: Option) => (
            <li key={option.label} className="py-1 flex gap-1 align-top">
              <Checkbox
                checked={option.selected}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const isChecked = e.target.checked;
                  const selected = optionsState.map(opt => {
                    if (opt.value === option.value) {
                      return { ...opt, selected: isChecked };
                    }
                    return opt;
                  });
                  setOptionsState(selected);
                  onChange(selected);
                }}
              />
              <span className="ml-2">{option.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export { MultiSelect };
