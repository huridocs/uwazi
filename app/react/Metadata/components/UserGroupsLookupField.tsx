import { setSelection } from 'app/Viewer/actions/selectionActions';
import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from 'UI';

interface UserGroupsLookupFieldProps {
  onChange: (search: string) => any;
  onSelect: (value: any) => any;
  value: string;
  options: any[];
}

export const UserGroupsLookupField = ({
  onChange,
  onSelect,
  value,
  options,
}: UserGroupsLookupFieldProps) => {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [value]);

  const onChangeHandler = (event: any) => {
    onChange(event.target.value);
  };

  const getOnSelectHandler = (selection: number) => onSelect(options[selection]);

  // eslint-disable-next-line max-statements
  const onKeyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!selected) {
        return setSelected(options.length - 1);
      }

      return setSelected((selected - 1) % options.length);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (selected === null) {
        return setSelected(0);
      }

      return setSelected((selected + 1) % options.length);
    }

    if (event.key === 'Enter' && selected !== null) {
      event.preventDefault();
      return onSelect(options[selected]);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      return onChange('');
    }

    return null;
  };

  return (
    <div className="userGroupsLookupField">
      <input
        type="text"
        placeholder="Add people or groups"
        onChange={onChangeHandler}
        onKeyDown={onKeyPressHandler}
        value={value}
      />
      {options.length ? (
        <ul role="listbox">
          {options.map((result: any, index: number) => (
            <li
              key={`${result.type}-${result.id}`}
              role="option"
              aria-selected={index === selected}
              onClick={getOnSelectHandler(index)}
              className={index === selected ? 'selected' : ''}
            >
              <div className="round-icon">
                <Icon icon={result.type === 'user' ? 'user' : 'users'} />
              </div>
              <span>{result.label}</span>
              <div className="press-enter-note">
                <span>Press enter to add</span>
                <Icon icon="level-down-alt" transform={{ rotate: 90 }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
