/* eslint-disable react/no-multi-comp */
import { Translate } from 'app/I18N';
import { Checkbox } from 'flowbite-react';
import React, { useRef, useState, useEffect } from 'react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { useOnClickOutside } from 'V2/shared/useOnClickOutside';
import { Pill } from '../UI';

type Option = { label: string; value: string };
type ContextOption = { label: string; value: string; selected?: boolean };

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: ContextOption[];
  onOptionSelected: (options: Option[]) => void;
}

interface ContextMenuProps {
  options: ContextOption[];
  show: boolean;
  location: { x: number; y: number };
  onOptionSelected: (options: ContextOption[]) => void;
}

const ContextMenuBase = (
  { options, show, location, onOptionSelected }: ContextMenuProps,
  ref: any
) =>
  show ? (
    <ul
      ref={ref}
      style={{
        minWidth: '225px',
        position: 'absolute',
        top: `${location.y}px`,
        left: `${location.x}px`,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      className="min-w-fit bg-white rounded-md p-4 font-medium  absolute flex flex-col"
    >
      {options.map((option: ContextOption) => (
        <li key={option.label} className="py-1">
          <Checkbox
            checked={option.selected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // @ts-ignore
              const isChecked = e.target.checked;
              const currentOptions = [...options].map(opt => {
                if (opt.value === option.value) {
                  return { ...opt, selected: isChecked };
                }
                return opt;
              });

              onOptionSelected(currentOptions);
            }}
          />
          <span className="ml-2">{option.label}</span>
        </li>
      ))}
    </ul>
  ) : null;

const ContextMenu = React.forwardRef(ContextMenuBase);
const getSelectedOptions = (options: ContextOption[]) =>
  options.filter(opt => opt.selected).map(opt => ({ label: opt.label, value: opt.value }));

const MultiSelect = ({ label, options, onOptionSelected }: MultiSelectProps) => {
  const [innerOptions, setInnerOptions] = useState<ContextOption[]>(
    options.map(opt => ({ ...opt, selected: false }))
  );
  const [menuLocation, setMenuLocation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menu, showMenu] = useState(false);
  const contextMenuRef = useRef<HTMLLIElement>();
  const containerRef = useRef(null);
  const MENU_OFFSET = 25;

  useEffect(() => {
    setInnerOptions(options);
  }, [options]);

  useOnClickOutside<HTMLDivElement>(containerRef, () => showMenu(false));

  return (
    <div
      className="border rounded-lg border-gray-50"
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
              setTimeout(() => {
                // @ts-ignore
                const totalWidth = e.view.innerWidth;
                const contextMenuWidth = contextMenuRef.current?.clientWidth;
                const contextMenuHeight = contextMenuRef.current?.clientHeight;

                if (!contextMenuHeight || !contextMenuWidth) return;

                let x = e.clientX;
                let y = e.clientY;

                setMenuLocation({ x: -(totalWidth - x - contextMenuWidth - MENU_OFFSET), y });
              }, 0);
              showMenu(!menu);
            }}
          >
            <PlusCircleIcon className="text-lg w-6" />
          </button>
        </div>
      </div>
      <div className="min-h-fit p-2 flex flex-wrap">
        {getSelectedOptions(innerOptions).length > 0 ? (
          getSelectedOptions(innerOptions).map((option: Option) => (
            <Pill color="gray" key={option.value} className="mb-2 flex flex-row">
              <span className="flex items-center">{option.label}</span>
              <button
                type="button"
                className="ml-1 text-gray-400 font-bold content-center justify-center"
                onClick={() => {
                  setInnerOptions(
                    innerOptions.map(opt => {
                      return opt.value === option.value ? { ...opt, selected: false } : opt;
                    })
                  );
                  const selectedOptions = innerOptions.filter(opt => {
                    return opt.value !== option.value;
                  });
                  onOptionSelected(getSelectedOptions(selectedOptions));
                }}
              >
                <XMarkIcon className="text-lg w-6" />
              </button>
            </Pill>
          ))
        ) : (
          <Translate>No options</Translate>
        )}
      </div>
      <ContextMenu
        ref={contextMenuRef}
        location={menuLocation}
        show={menu}
        options={innerOptions}
        onOptionSelected={(ops: ContextOption[]) => {
          setInnerOptions(ops);
          onOptionSelected(getSelectedOptions(ops));
        }}
      />
    </div>
  );
};

export type { MultiSelectProps };
export { MultiSelect };
