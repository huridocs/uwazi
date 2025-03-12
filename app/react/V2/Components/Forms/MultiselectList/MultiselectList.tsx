/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-statements */
import React, { useEffect, useState, useRef } from 'react';
import { Translate } from 'app/I18N';

import { isString } from 'lodash';
import { InputField, RadioSelect } from '..';
import { Label } from '../Label';
import { Checkbox } from '../Checkbox';
import { MultiselectListButtonItem } from './MultiselectListButtonItem';
import { MultiselectListGroup } from './MultiselectListGroup';

interface MultiselectListOption {
  label: string | React.ReactNode;
  searchLabel: string;
  value: string;
  items?: MultiselectListOption[];
  suggested?: boolean;
}

interface MultiselectListProps {
  items: MultiselectListOption[];
  onChange: (selectedValue: string[]) => void;
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
  itemClassName?: string;
  itemContainerClassName?: string;
  hideFilters?: boolean;
  blankState?: string | React.ReactNode;
  lookup?: (searchterm: string) => Promise<MultiselectListOption[]>;
}

const renderChild = (child: string | React.ReactNode) =>
  isString(child) ? <Translate>{child}</Translate> : child;

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

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
  hideFilters = false,
  itemClassName,
  itemContainerClassName,
  blankState = <Translate>No items available</Translate>,
  lookup,
}: MultiselectListProps) => {
  const [selectedValue, setSelectedValue] = useState<string[]>(value || []);
  const [selecteditems, setSelecteditems] = useState<MultiselectListOption[]>([]);
  const [showAll, setShowAll] = useState<boolean>(!(startOnSelected && selectedValue.length));
  const [searchTerm, setSearchTerm] = useState('');
  const [externalSearch, setExternalSearch] = useState(search);
  const [filteredItems, setFilteredItems] = useState(items);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrSuggestedItems, setSelectedOrSuggestedItems] = useState<Set<string>>(
    new Set(selectedValue)
  );
  const optionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const newSet = new Set<string>(selectedValue);
    const selected: MultiselectListOption[] = [];
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

    selectedValue.forEach(val => {
      const item = filteredItems.find(
        i => i.value === val || i.items?.some(subitem => subitem.value === val)
      );
      if (item) {
        selected.push(item);
      }
    });

    setSelectedOrSuggestedItems(newSet);
    setSelecteditems(selected);
  }, [items, selectedValue]);

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
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    let filtered: MultiselectListOption[] = [];

    const filterByLookup = async () => {
      setSearching(true);
      if (lookup && searchTerm) {
        filtered = await lookup(searchTerm);
      }
      selecteditems.forEach(item => {
        if (!filtered.find(i => i.value === item.value)) {
          filtered.push(item);
        }
      });
      setSearching(false);
      setFilteredItems(filtered);
    };

    const debouncedFilterByLookup = debounce(filterByLookup, 300);

    if (lookup && searchTerm) {
      debouncedFilterByLookup();
      return;
    }

    const labelIncludesSearch = (_label: string) => {
      const a = _label
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      const b = searchTerm
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
      return a.includes(b);
    };

    filtered = items
      .map(item => {
        const matchesSearch = !searchTerm || labelIncludesSearch(item.searchLabel);

        const containsChildrenMatchingSearch =
          !searchTerm || item.items?.some(childItem => labelIncludesSearch(childItem.searchLabel));

        if (matchesSearch || containsChildrenMatchingSearch) {
          return {
            ...item,
            items: item.items?.filter(childItem =>
              childItem.searchLabel.toLowerCase().includes(searchTerm.toLowerCase())
            ),
          };
        }
      })
      .filter(item => item) as MultiselectListOption[];

    setFilteredItems(filtered);
  }, [items, searchTerm, lookup, selecteditems]);

  const handleSelect = (_value: string) => {
    let newValues;
    if (singleSelect) {
      newValues = selectedValue.includes(_value) ? [] : [_value];
    } else {
      newValues = selectedValue.includes(_value)
        ? selectedValue.filter(item => item !== _value)
        : [...selectedValue, _value];
    }

    setSelectedValue(newValues);
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

    setSelectedValue(allValues);
    if (onChange) onChange(allValues);
  };

  const applyFilter = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setShowAll(target.value === 'true');
  };

  const renderButtonItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }

    const selected = selectedValue.includes(item.value);

    return (
      <MultiselectListButtonItem
        key={item.value}
        item={item}
        selected={selected}
        onClick={() => handleSelect(item.value)}
        itemClassName={itemClassName}
      />
    );
  };

  const renderCheckboxItem = (item: MultiselectListOption) => {
    if (item.items) {
      return renderGroup(item);
    }
    const selected = selectedValue.includes(item.value);
    return (
      <li
        key={item.value}
        className={`${!selected && searchTerm && !showAll ? 'opacity-70' : ''} ${itemClassName ?? ' bg-gray-50 rounded-lg mb-2'} `}
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

  const renderItem = (item: MultiselectListOption) => {
    const itemHasSelectedChildren = item.items?.some(
      childItem => selectedValue.includes(childItem.value) || childItem.suggested
    );

    if (
      !showAll &&
      !selectedValue.includes(item.value) &&
      !item.suggested &&
      !itemHasSelectedChildren
    ) {
      return null;
    }

    return checkboxes ? renderCheckboxItem(item) : renderButtonItem(item);
  };

  const renderGroup = (group: MultiselectListOption) => {
    const isOpen = isGroupOpen(group.value);

    return (
      <MultiselectListGroup
        key={group.value}
        label={group.label}
        isOpen={isOpen}
        foldable={foldableGroups}
        onClick={() => handleGroupToggle(group.value)}
        itemContainerClassName={itemContainerClassName}
        itemClassName={itemClassName}
      >
        {group.items?.map(renderItem)}
      </MultiselectListGroup>
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
        <Translate>Selected</Translate> {selectedValue.length ? `(${selectedValue.length})` : ''}
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
        {!hideFilters && (
          <div className="flex mx-1 my-4 flex-nowrap" data-testid="multiselectlist-filters">
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
        )}
      </div>

      {filteredItems.length === 0 && !searching && (
        <div className="flex w-full h-full items-center justify-center min-h-[400px]">
          {renderChild(blankState)}
        </div>
      )}
      <ul className={`${itemContainerClassName ?? ' w-full px-2 pt-2 grow '}`} ref={optionsRef}>
        {filteredItems.map(renderItem)}
      </ul>
    </div>
  );
};
export { MultiselectList };
export type { MultiselectListOption };
