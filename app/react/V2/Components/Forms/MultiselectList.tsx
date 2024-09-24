/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-statements */
import React, { useEffect, useState, useRef } from 'react';
import { Translate } from 'app/I18N';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { InputField, RadioSelect } from '.';
import { Pill } from '../UI/Pill';
import { Label } from './Label';
import { Checkbox } from './Checkbox';

interface MultiselectListOption {
  label: string | React.ReactNode;
  searchLabel: string;
  value: string;
  items?: MultiselectListOption[];
  suggested?: boolean;
}
interface MultiselectListProps {
  items: MultiselectListOption[];
  onChange: (selectedItems: string[]) => void;
  label?: string | React.ReactNode;
  hasErrors?: boolean;
  className?: string;
  checkboxes?: boolean;
  value?: string[];
  foldableGroups?: boolean;
  singleSelect?: boolean;
  allowSelelectAll?: boolean;
  startOnSelected?: boolean;
  search?: string;
  suggestions?: boolean;
}

const MultiselectList = ({
  items,
  onChange,
  className = '',
  label,
  hasErrors,
  value,
  checkboxes = false,
  foldableGroups = false,
  singleSelect = false,
  allowSelelectAll = false,
  startOnSelected = false,
  search = '',
  suggestions = false,
}: MultiselectListProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>(value || []);
  const [showAll, setShowAll] = useState<boolean>(!(startOnSelected && selectedItems.length));
  const [searchTerm, setSearchTerm] = useState('');
  const [externalSearch, setExternalSearch] = useState(search);
  const [filteredItems, setFilteredItems] = useState(items);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [selectedOrSuggestedItems, setSelectedOrSuggestedItems] = useState<Set<string>>(
    new Set(selectedItems)
  );
  const optionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const newSet = new Set<string>(selectedItems);
    items.forEach(item => {
      if (item.suggested) {
        newSet.add(item.value);
      }

      if (item.items) {
        item.items.forEach(subItem => {
          if (subItem.suggested) {
            newSet.add(subItem.value);
          }
        });
      }
    });

    setSelectedOrSuggestedItems(newSet);
  }, [items, selectedItems]);

  useEffect(() => {
    if (startOnSelected) {
      const groupsToExpand = items
        .filter(item => item.items?.some(childItem => value?.includes(childItem.value)))
        .map(item => item.value);

      setOpenGroups(groupsToExpand);
    }
  }, [items, value, startOnSelected]);

  useEffect(() => {
    setSearchTerm(search);
    setExternalSearch(search);
  }, [search]);

  useEffect(() => {
    if (externalSearch && searchTerm) {
      optionsRef.current?.querySelector('input')?.focus();
    }
  }, [externalSearch, filteredItems, searchTerm]);

  useEffect(() => {
    if (value) {
      setSelectedItems(value);
    }
  }, [value]);

  useEffect(() => {
    let filtered = [...items];

    filtered = filtered
      .map(item => {
        const itemiSelected = selectedItems.includes(item.value) || item.suggested;
        const containsSelected = item.items?.some(
          childItem => selectedItems.includes(childItem.value) || childItem.suggested
        );

        const matchesSearch =
          !searchTerm || item.searchLabel.toLowerCase().includes(searchTerm.toLowerCase());

        const containsChildrenMatchingSearch =
          !searchTerm ||
          item.items?.some(childItem =>
            childItem.searchLabel.toLowerCase().includes(searchTerm.toLowerCase())
          );

        if (showAll && !searchTerm) {
          return item;
        }

        if (!showAll && !searchTerm && (itemiSelected || containsSelected)) {
          return {
            ...item,
            items: item.items?.filter(
              childItem => selectedItems.includes(childItem.value) || childItem.suggested
            ),
          };
        }

        if (searchTerm && (matchesSearch || containsChildrenMatchingSearch)) {
          return {
            ...item,
            items: item.items?.filter(childItem =>
              childItem.searchLabel.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          };
        }

        return null;
      })
      .filter(item => item) as MultiselectListOption[];

    setFilteredItems(filtered);
  }, [items, searchTerm, showAll, selectedItems]);

  const handleSelect = (_value: string) => {
    let newValues;
    if (singleSelect) {
      newValues = selectedItems.includes(_value) ? [] : [_value];
    } else {
      newValues = selectedItems.includes(_value)
        ? selectedItems.filter(item => item !== _value)
        : [...selectedItems, _value];
    }

    setSelectedItems(newValues);
    setExternalSearch('');
    if (onChange) onChange(newValues);
  };

  const handleSelectAll = () => {
    const allValues: string[] = [];

    items.forEach(item => {
      if (item.items?.length) {
        item.items?.forEach(subItem => allValues.push(subItem.value));
      } else {
        allValues.push(item.value);
      }
    });

    setSelectedItems(allValues);
    if (onChange) onChange(allValues);
  };

  const applyFilter = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(target.value === 'true');
  };

  const renderButtonItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }

    const selected = selectedItems.includes(item.value);
    const borderSyles = selected
      ? 'border-sucess-200'
      : 'border-transparent hover:border-primary-300';

    return (
      <li key={item.value} className="mb-4">
        <button
          type="button"
          className={`w-full flex text-left p-2.5 border ${borderSyles} rounded-lg items-center`}
          onClick={() => handleSelect(item.value)}
        >
          <span className="flex-1">{item.label}</span>
          <div className="flex-1">
            <Pill className="float-right" color={selected ? 'green' : 'primary'}>
              {selected ? <Translate>Selected</Translate> : <Translate>Select</Translate>}
            </Pill>
          </div>
        </button>
      </li>
    );
  };

  const renderCheckboxItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }
    const selected = selectedItems.includes(item.value);
    return (
      <li
        key={item.value}
        className={`mb-2 ${!selected && searchTerm && !showAll ? 'opacity-70' : ''}`}
      >
        <Checkbox
          name={item.value}
          label={item.label}
          checked={selected}
          onChange={() => handleSelect(item.value)}
        />
      </li>
    );
  };

  const handleGroupToggle = (groupKey: string) => {
    if (openGroups.includes(groupKey)) {
      setOpenGroups(openGroups.filter(group => group !== groupKey));
    } else {
      setOpenGroups([...openGroups, groupKey]);
    }
  };

  const isGroupOpen = (groupKey: string) => openGroups.includes(groupKey);

  const renderItem = (item: MultiselectListOption) =>
    checkboxes ? renderCheckboxItem(item) : renderButtonItem(item);

  const renderGroup = (group: MultiselectListOption) => {
    const isOpen = isGroupOpen(group.value);
    if (foldableGroups) {
      return (
        <li key={group.value} className="mb-4">
          <div
            className={`flex justify-between p-3 mb-4 rounded-lg ${isOpen ? 'bg-indigo-50' : 'bg-gray-50'}`}
            onClick={() => handleGroupToggle(group.value)}
          >
            <span className="block text-sm font-bold text-gray-900">{group.label}</span>
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
          {isOpen && <ul className="pl-4">{group.items?.map(renderItem)}</ul>}
        </li>
      );
    }

    return (
      <li key={group.value} className="mb-4">
        <span className="block mb-4 text-sm font-bold text-gray-900">{group.label}</span>
        <ul className="">{group.items?.map(renderItem)}</ul>
      </li>
    );
  };

  const renderSelectedLabel = () => {
    if (suggestions) {
      return (
        <>
          <Translate>Selected or suggested</Translate>{' '}
          {selectedOrSuggestedItems.size ? `(${selectedOrSuggestedItems.size})` : ''}
        </>
      );
    }

    return (
      <>
        <Translate>Selected</Translate> {selectedItems.length ? `(${selectedItems.length})` : ''}
      </>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="sticky top-0 w-full pt-4 mb-2 bg-white">
        <Label htmlFor="search-multiselect" hideLabel={!label} hasErrors={Boolean(hasErrors)}>
          {label}
        </Label>
        <InputField
          id="search-multiselect"
          label="search-multiselect"
          hideLabel
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search"
          value={searchTerm}
          clearFieldAction={() => setSearchTerm('')}
        />
        <div className="flex mx-1 my-4 flex-nowrap">
          <RadioSelect
            name="filter"
            orientation="horizontal"
            options={[
              {
                label: <Translate data-testid="multiselectlist-show-all">All</Translate>,
                value: 'true',
                defaultChecked: !startOnSelected,
              },
              {
                label: renderSelectedLabel(),
                value: 'false',
                disabled: selectedOrSuggestedItems.size === 0,
                defaultChecked: startOnSelected,
              },
            ]}
            onChange={applyFilter}
            className="flex-grow"
          />
          {allowSelelectAll && (
            <button
              type="button"
              className="text-gray-400 underline"
              onClick={() => handleSelectAll()}
            >
              <Translate>Select all</Translate>
            </button>
          )}
        </div>
      </div>

      <ul className="w-full px-2 pt-2 grow" ref={optionsRef}>
        {filteredItems.map(renderItem)}
      </ul>
    </div>
  );
};
export { MultiselectList };
export type { MultiselectListOption };
