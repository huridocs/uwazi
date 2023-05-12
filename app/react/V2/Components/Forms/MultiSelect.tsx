import { Translate } from 'app/I18N';
import { Checkbox } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react';
import { Pill } from '../UI';
import { XMarkIcon, PlusCircleIcon } from '@heroicons/react/20/solid';

type Option = { label: string; value: string };
type ContextOption = Option & { selected: boolean };

interface MultiSelectProps {
  label: String;
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
) => {
  return show ? (
    <ul
      ref={ref}
      style={{
        minWidth: '225px',
        position: 'absolute',
        top: `${location.y}px`,
        left: `${location.x}px`,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      className="min-w-fit bg-white border-4 rounded-md p-4 font-medium  absolute flex flex-col"
    >
      {options.map((option: ContextOption) => (
        <li key={option.label} className="py-1">
          <Checkbox
            checked={option.selected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              // @ts-ignore
              const isChecked = e.target.checked;
              let currentOptions = [...options].map(opt => {
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
};

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
      <div className="border-b border-gray-50 bg-gray-50 p-4 flex justify-between">
        <div className="text-indigo-700 text-base">{label}</div>
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
            <PlusCircleIcon className="text-lg w-6" />
          </button>
        </div>
      </div>
      <div className="min-h-fit p-2 flex flex-wrap">
        {getSelectedOptions().length > 0 ? (
          getSelectedOptions().map((option: Option) => (
            <Pill color="gray" key={option.value} className="mb-2 flex flex-row">
              <span className="flex items-center">{option.label}</span>
              <button
                className="ml-1 text-gray-400 font-bold content-center justify-center"
                onClick={() => {
                  setInnerOptions(
                    innerOptions.map(opt =>
                      opt.value === option.value ? { ...opt, selected: false } : opt
                    )
                  );
                  onOptionSelected(getSelectedOptions());
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
          onOptionSelected(getSelectedOptions());
        }}
      />
    </div>
  );
};

export { MultiSelect };
