import React, { useEffect, useState } from 'react';
import { Icon } from 'UI';
import { MemberWithPermission } from '../EntityPermisions';
import { MemberListItem } from './MemberListItem';

interface UserGroupsLookupFieldProps {
  onChange: (search: string) => void;
  onSelect: (value: MemberWithPermission) => void;
  value: string;
  options: MemberWithPermission[];
}

export const UserGroupsLookupField = ({
  onChange,
  onSelect,
  value,
  options,
}: UserGroupsLookupFieldProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setSelected(null);
  }, [value]);

  const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const getOnSelectHandler = (selection: number) => () => {
    onSelect(options[selection]);
    onChange('');
  };

  const onKeyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (!selected) {
          setSelected(options.length - 1);
        } else {
          setSelected((selected - 1) % options.length);
        }

        break;
      case 'ArrowDown':
        event.preventDefault();
        if (selected === null) {
          setSelected(0);
        } else {
          setSelected((selected + 1) % options.length);
        }

        break;
      case 'Enter':
        event.preventDefault();
        if (selected !== null) {
          onSelect(options[selected]);
          onChange('');
        }
        break;
      case 'Escape':
        event.preventDefault();
        onChange('');
        break;
      default:
        break;
    }
  };

  return (
    <div className="userGroupsLookupField">
      <input
        type="text"
        placeholder="Add people or groups"
        onChange={onChangeHandler}
        onKeyDown={onKeyPressHandler}
        onBlur={() => setShow(false)}
        onFocus={() => setShow(true)}
        value={value}
      />
      {show && options.length ? (
        <ul role="listbox">
          {options.map((result: MemberWithPermission, index: number) => (
            <li
              key={`${result.type}-${result.id}`}
              role="option"
              aria-selected={index === selected}
              onClick={getOnSelectHandler(index)}
              className={index === selected ? 'selected' : ''}
            >
              <MemberListItem value={result} />
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
