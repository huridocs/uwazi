import { Translate } from 'app/I18N';
import { Checkbox } from 'flowbite-react';
import React, { useRef, useState } from 'react';
import { Pill } from '../UI';

type Option = { label: string; value: string };
type ContextOption = Option & { selected: boolean };

interface MultiSelectProps {
  label: String;
  options: Option[];
}

interface ContextMenuProps {
  options: ContextOption[];
  show: boolean;
  location: { x: number; y: number };
  onOptionSelected: (options: Option[]) => void;
}

const icons = {
  fillPlus: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path
        fill-rule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
        clip-rule="evenodd"
      />
    </svg>
  ),
};

const ContextMenuBase = (
  { options, show, location, onOptionSelected }: ContextMenuProps,
  ref: any
) => {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
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
      className={`min-w-fit bg-white border-4 rounded-md p-4 font-medium border-gray-700 absolute flex flex-col`}
    >
      {options.map((option: ContextOption) => (
        <li key={option.label} className="py-1">
          <Checkbox
            checked={option.selected}
            onClick={e => {
              let currentOptions = [...selectedOptions];
              // @ts-ignore
              if (e.target.checked) {
                currentOptions.push(option);
              } else {
                currentOptions = selectedOptions.filter(
                  (innerOption: Option) => innerOption.value !== option.value
                );
              }
              onOptionSelected(currentOptions);
              setSelectedOptions(currentOptions);
            }}
          />
          <span className="ml-2">{option.label}</span>
        </li>
      ))}
    </ul>
  ) : (
    <></>
  );
};

const ContextMenu = React.forwardRef(ContextMenuBase);

const MultiSelect = ({ label, options }: MultiSelectProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const [menuLocation, setMenuLocation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menu, showMenu] = useState(false);
  const contextMenuRef = useRef<HTMLLIElement>();
  const MENU_OFFSET = 15;

  return (
    <div className="border rounded-lg border-gray-50">
      <div className="border-b border-gray-50 bg-gray-50 p-4 flex justify-between">
        <div className="text-indigo-700 text-base">{label}</div>
        <div className="left-0">
          <button
            type="button"
            className="text-indigo-700"
            onClick={(e: any) => {
              setTimeout(() => {
                // Viewport width
                const totalWidth = e.view.innerWidth;
                const totalHeight = e.view.innerHeight;
                const contextMenuWidth = contextMenuRef.current?.clientWidth || 0;
                const contextMenuHeight = contextMenuRef.current?.clientHeight || 0;

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
                setMenuLocation({ x, y });
              }, 0);
              showMenu(!menu);
            }}
          >
            {icons.fillPlus}
          </button>
        </div>
      </div>
      <div className="min-h-fit p-6 flex flex-wrap">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option: Option) => (
            <Pill color="gray" key={option.value}>
              {option.label}
              <button
                className="p-[10px] ml-1 text-gray-400 font-bold"
                onClick={() => {
                  setSelectedOptions(currentSelectedOptions =>
                    currentSelectedOptions.filter(opt => opt.value !== option.value)
                  );
                }}
              >
                x
              </button>
            </Pill>
          ))
        ) : (
          <Translate>No groups</Translate>
        )}
      </div>
      <ContextMenu
        ref={contextMenuRef}
        location={menuLocation}
        show={menu}
        options={options.map(opt => {
          if (selectedOptions.find(o => o.value === opt.value)) {
            return { ...opt, selected: true };
          }
          return { ...opt, selected: false };
        })}
        onOptionSelected={(options: Option[]) => {
          setSelectedOptions(options);
        }}
      />
    </div>
  );
};

export { MultiSelect };
