/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from 'flowbite-react';
import { Translate } from 'app/I18N';
import { Option, ContextOption } from './SelectTypes';
import { Pill } from '../UI';

interface MultiSelectProps {
  label: String | React.ReactNode;
  options: Option[];
  onOptionSelected: (options: Option[]) => void;
  placeholder?: String | React.ReactNode;
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
        position: 'absolute',
        top: `${location.y}px`,
        left: `${location.x}px`,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      className="absolute flex flex-col p-4 font-medium bg-white rounded-md min-w-fit"
    >
      {options.map((option: ContextOption) => (
        <li key={option.value} className="py-1">
          <label className="cursor-pointer">
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
          </label>
        </li>
      ))}
    </ul>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );

const ContextMenu = React.forwardRef(ContextMenuBase);

const MultiSelect = ({
  label,
  options,
  onOptionSelected,
  placeholder = 'No options',
}: MultiSelectProps) => {
  const [innerOptions, setInnerOptions] = useState<ContextOption[]>([]);
  const [menuLocation, setMenuLocation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menu, showMenu] = useState(false);
  const contextMenuRef = useRef<HTMLLIElement>();
  const buttonRef = useRef<HTMLButtonElement>();
  const MENU_OFFSET = 15;

  useEffect(() => {
    setInnerOptions(options.map(opt => ({ ...opt, selected: false })));
  }, [options]);

  useEffect(() => {
    const closeMenuOnClickOutside = (e: MouseEvent) => {
      if (
        !contextMenuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        showMenu(false);
      }
    };

    document.addEventListener('click', closeMenuOnClickOutside);
    return () => document.removeEventListener('click', closeMenuOnClickOutside);
  }, []);

  const getSelectedOptions = () => innerOptions.filter(opt => opt.selected);

  return (
    <div className="border rounded-lg border-gray-50" data-testid="multiselect-comp">
      <div className="flex justify-between p-4 border-b border-gray-50 bg-gray-50">
        <div className="text-base text-indigo-700">{label}</div>
        <div className="left-0">
          <button
            type="button"
            ref={buttonRef}
            className="text-indigo-700"
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
              setTimeout(() => {
                // Viewport width
                // @ts-ignore
                const totalWidth = e.view.innerWidth;
                // @ts-ignore
                const totalHeight = e.view.innerHeight;
                const contextMenuWidth = contextMenuRef.current?.clientWidth;
                const contextMenuHeight = contextMenuRef.current?.clientHeight;

                if (!contextMenuHeight || !contextMenuWidth) return;

                let x = e.clientX;
                let y = e.clientY;

                if (x + contextMenuWidth > totalWidth) {
                  // Context menu will go out of the viewport
                  x -= contextMenuWidth + MENU_OFFSET; // Display CM offset towards the view port
                }

                if (y + contextMenuHeight > totalHeight) {
                  // Context menu will go out of the viewport
                  y = -y; // Display CM offset towards the view port
                }
                setMenuLocation({ x: x + MENU_OFFSET, y: y + MENU_OFFSET });
              }, 0);
              showMenu(!menu);
            }}
          >
            <PlusCircleIcon className="w-6 text-lg" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4 min-h-fit">
        {getSelectedOptions().length > 0 ? (
          getSelectedOptions().map((option: Option) => (
            <Pill color="gray" key={option.value} className="flex flex-row">
              <span className="flex items-center">{option.label}</span>
              <button
                type="button"
                className="content-center justify-center ml-1 font-bold text-gray-400"
                onClick={() => {
                  setInnerOptions(
                    innerOptions.map(opt =>
                      opt.value === option.value ? { ...opt, selected: false } : opt
                    )
                  );
                  onOptionSelected(getSelectedOptions());
                }}
              >
                <XMarkIcon className="w-6 text-lg" />
              </button>
            </Pill>
          ))
        ) : (
          <Translate className="text-gray-500">{placeholder}</Translate>
        )}
      </div>
      <ContextMenu
        ref={contextMenuRef}
        location={menuLocation}
        show={menu}
        options={innerOptions}
        onOptionSelected={(ops: ContextOption[]) => {
          setInnerOptions(ops);
          onOptionSelected(getSelectedOptions());
        }}
      />
    </div>
  );
};

export { MultiSelect };
