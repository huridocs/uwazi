import { Translate } from 'app/I18N';
import { Checkbox } from 'flowbite-react';
import React, { useEffect, useRef, useState } from 'react';
import { number, option } from 'yargs';
import { Pill } from '../UI';

type Option = { label: string; value: string };

interface MultiSelectProps {
  label: String;
  options: Option[];
}

interface ContextMenuProps {
  options: Option[];
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

const ContextMenu = ({ options, show, location, onOptionSelected }: ContextMenuProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  return (
    <ul
      style={{
        position: 'absolute',
        top: `${location.y}px`,
        left: `${location.x}px`,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      className={`bg-white p-4 min-h-screen border-r-4 border-gray-700 absolute flex flex-col ${
        show ? '' : 'hidden'
      }`}
    >
      {options.map((option: Option) => (
        <li key={option.label}>
          <Checkbox
            onClick={e => {
              // @ts-ignore
              if (!e.target.checked) {
                const options = [...selectedOptions, option];
                setSelectedOptions(options);
              } else {
                const options = selectedOptions.filter(
                  (innerOption: Option) => innerOption.value !== option.value
                );
                setSelectedOptions(options);
              }
              setTimeout(() => {
                onOptionSelected(selectedOptions);
              }, 1);
            }}
          />
          {option.label}
        </li>
      ))}
    </ul>
  );
};

const MultiSelect = ({ label, options }: MultiSelectProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const [menuLocation, setMenuLocation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menu, showMenu] = useState(false);
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
              const x = e.clientX + MENU_OFFSET;
              const y = e.clientY + MENU_OFFSET;
              setMenuLocation({ x, y });
              showMenu(!menu);
            }}
          >
            {icons.fillPlus}
          </button>
        </div>
      </div>
      <div className="min-h-fit p-6">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option: Option) => (
            <Pill color="gray" key={option.value}>
              {option.label}
            </Pill>
          ))
        ) : (
          <Translate>No groups</Translate>
        )}
      </div>
      <ContextMenu
        location={menuLocation}
        show={menu}
        options={options}
        onOptionSelected={(options: Option[]) => {
          console.log(options);
          setSelectedOptions(options);
        }}
      />
    </div>
  );
};

export { MultiSelect };
