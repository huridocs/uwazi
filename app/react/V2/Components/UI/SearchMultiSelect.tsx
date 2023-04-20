import React, { useEffect, useState } from 'react';
import { Translate } from 'app/I18N';
import { InputField } from './InputField';
import { Pill } from './Pill';

interface SearchMultiselectProps {
  items: { label: string; value: string }[];
  onChange: (selectedItems: string[]) => void;
}

const SearchMultiselect = ({ items, onChange }: SearchMultiselectProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    onChange(selectedItems);
  }, [onChange, selectedItems]);

  const handleSelect = (value: string) => {
    if (selectedItems.includes(value)) {
      setSelectedItems(selectedItems.filter(item => item !== value));
    } else {
      setSelectedItems([...selectedItems, value]);
    }
  };

  return (
    <div>
      <div className="mb-4 sticky top-0 w-full">
        <InputField
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search"
          value={searchTerm}
          clearFieldAction={() => setSearchTerm('')}
        />
      </div>

      <ul className="w-full">
        {items.map(({ label, value }) => {
          const hidden = !label.toLowerCase().includes(searchTerm.toLowerCase());
          const selected = selectedItems.includes(value);
          const borderSyles = selected
            ? 'border-sucess-200'
            : 'border-transparent hover:border-primary-300';

          return (
            <li key={value} className={`mb-4 ${hidden ? 'hidden' : ''}`}>
              <button
                type="button"
                className={`w-full flex text-left p-2.5 border ${borderSyles} rounded-lg items-center`}
                onClick={() => handleSelect(value)}
              >
                <span className="flex-1">{label}</span>
                <div className="flex-1">
                  <Pill className="float-right" color={selected ? 'green' : 'primary'}>
                    {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
                  </Pill>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export { SearchMultiselect };
