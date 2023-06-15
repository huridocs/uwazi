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
      className="absolute flex flex-col p-4 font-medium bg-white rounded-md min-w-fit"
    >
      {options.map((option: ContextOption) => (
        <li key={option.value} className="py-1">
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
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );

const ContextMenu = React.forwardRef(ContextMenuBase);

const MultiSelect = ({ label, options, onOptionSelected }: MultiSelectProps) => {
  const [innerOptions, setInnerOptions] = useState<ContextOption[]>([]);
  const [menuLocation, setMenuLocation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menu, showMenu] = useState(false);
  const contextMenuRef = useRef<HTMLLIElement>();
  const MENU_OFFSET = 15;

  useEffect(() => {
    setInnerOptions(options.map(opt => ({ ...opt, selected: false })));
  }, [options]);

  const getSelectedOptions = () => innerOptions.filter(opt => opt.selected);

  return (
    <div className="border rounded-lg border-gray-50" data-testid="multiselect-comp">
      <div className="flex justify-between p-4 border-b border-gray-50 bg-gray-50">
        <div className="text-base text-indigo-700">{label}</div>
        <div className="left-0">
          <button
            type="button"
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
      <div className="flex flex-wrap p-2 min-h-fit">
        {getSelectedOptions().length > 0 ? (
          getSelectedOptions().map((option: Option) => (
            <Pill color="gray" key={option.value} className="flex flex-row mb-2">
              <span className="flex items-center">{option.label}</span>
              <button
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
          onOptionSelected(getSelectedOptions());
        }}
      />
    </div>
  );
};

export { MultiSelect };
