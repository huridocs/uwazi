/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react';
import { Popover } from '@headlessui/react';
import { InputField } from 'app/V2/Components/Forms';

type ColorPickerProps = {
  name: string;
  onChange?: (color: string) => void;
  value?: string;
  className?: string;
  hasErrors?: boolean;
};

const defaultColors = [
  '#C03B22',
  '#D9534F',
  '#E91E63',
  '#A03AB1',
  '#6F46B8',
  '#3F51B5',
  '#2196F3',
  '#37BDCF',
  '#359990',
  '#5CB85C',
  '#8BC34A',
  '#CDDC39',
  '#CCBC2F',
  '#F0AD4E',
  '#EC9920',
  '#E46841',
  '#795548',
  '#9E9E9E',
  '#607D8B',
];

const ColorPicker = ({
  name,
  className,
  onChange,
  hasErrors,
  value = defaultColors[0],
}: ColorPickerProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const changeColor = (color: string) => {
    setLocalValue(color);
    if (onChange) {
      onChange(color);
    }
  };

  const dynamicStyles = hasErrors ? 'border-error-300' : 'border-gray-100';

  return (
    <div className={`${className}`}>
      <Popover className="">
        <Popover.Button
          className={`w-[37px] h-[37px] border cursor-pointer rounded-lg ring-0 ${dynamicStyles}`}
        >
          <div
            data-testid="colorpicker-button"
            className="m-auto rounded-md w-7 h-7"
            style={{ backgroundColor: localValue }}
          />
        </Popover.Button>
        <Popover.Panel
          as="div"
          className="flex flex-col gap-2 p-2 bg-white rounded-md shadow max-w-[188px] z-10 m-2"
        >
          <ul className="flex flex-wrap gap-2" data-testid="colorpicker-popover">
            {defaultColors.map((color: string) => (
              <li key={color}>
                <button
                  type="button"
                  className="w-full cursor-pointer"
                  onClick={() => changeColor(color)}
                >
                  <span className="sr-only">{color}</span>
                  <div
                    data-testid="colorpicker-button"
                    className="m-auto rounded-sm w-7 h-7"
                    style={{ backgroundColor: color }}
                  />
                </button>
              </li>
            ))}
          </ul>
          <InputField
            id={name}
            type="text"
            name={name}
            value={localValue.slice(1)}
            preText="#"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              changeColor(`#${e.target.value}`);
            }}
            className="w-full"
            hasErrors={hasErrors}
          />
        </Popover.Panel>
      </Popover>
    </div>
  );
};

export { ColorPicker };
