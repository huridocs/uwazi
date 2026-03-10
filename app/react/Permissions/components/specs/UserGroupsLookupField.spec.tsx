/**
 * @jest-environment jsdom
 */
import { mount, shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { UserGroupsLookupField } from '../UserGroupsLookupField';

describe('UserGroupsLookupField', () => {
  let onChangeMock: (search: string) => void;
  let onSelectMock: (value: MemberWithPermission) => void;

  beforeEach(() => {
    onChangeMock = jest.fn();
    onSelectMock = jest.fn();
  });

  it('should render the options', () => {
    const options: MemberWithPermission[] = [
      {
        refId: 'id',
        label: 'label',
        type: PermissionType.USER,
        level: AccessLevels.READ,
      },
      {
        refId: 'id2',
        label: 'label',
        type: PermissionType.GROUP,
      },
    ];

    const component = shallow(
      <UserGroupsLookupField onChange={onChangeMock} onSelect={onSelectMock} options={options} />
    );

    component.find('input').first().simulate('focus');

    const items = component.find('li');
    expect(items.find({ value: options[0] }).length).toBe(1);
    expect(items.find({ value: options[1] }).length).toBe(1);
    expect(items.length).toBe(2);
  });

  it('should trigger onChange when typing', done => {
    const component = mount(
      <UserGroupsLookupField onChange={onChangeMock} onSelect={onSelectMock} options={[]} />
    );

    component.find('input').first().simulate('focus');

    component.find('input').simulate('change', { target: { value: 'new value' } });
    setTimeout(() => {
      expect(onChangeMock).toHaveBeenCalledWith('new value');
      done();
    }, 500);
  });

  it('should trigger onSelect when clicking an option', () => {
    const component = shallow(
      <UserGroupsLookupField
        onChange={onChangeMock}
        onSelect={onSelectMock}
        options={[
          {
            refId: 'id',
            label: 'label',
            type: PermissionType.USER,
          },
        ]}
      />
    );

    component.find('input').first().simulate('focus');

    component.find('li').simulate('click');

    expect(onSelectMock).toHaveBeenCalledWith({
      refId: 'id',
      label: 'label',
      type: PermissionType.USER,
    });
  });

  it('should show/hide the dropdown when focusing/unfocusing', () => {
    const component = shallow(
      <UserGroupsLookupField
        onChange={onChangeMock}
        onSelect={onSelectMock}
        options={[
          {
            refId: 'id',
            label: 'label',
            type: PermissionType.USER,
          },
        ]}
      />
    );

    const inputElem = component.find('input').first();

    inputElem.simulate('focus');

    expect(component.find('ul').length).toBe(1);

    inputElem.simulate('blur', { relatedTarget: 'Some other target' });

    expect(component.find('ul').length).toBe(0);
  });

  describe('keyboard use', () => {
    let component: ShallowWrapper;

    const getEvent = (key: string) => ({ preventDefault: () => {}, key });

    beforeEach(() => {
      component = shallow(
        <UserGroupsLookupField
          onChange={onChangeMock}
          onSelect={onSelectMock}
          options={[
            {
              refId: 'id1',
              label: 'user',
              type: PermissionType.USER,
            },
            {
              refId: 'id2',
              label: 'group',
              type: PermissionType.GROUP,
            },
            {
              refId: 'id3',
              label: 'group2',
              type: PermissionType.GROUP,
            },
            {
              refId: 'id4',
              label: 'user2',
              type: PermissionType.USER,
            },
          ]}
        />
      );

      component.find('input').first().simulate('focus');
    });

    it('should not trigger an event if Enter press with no seletion', () => {
      component.find('input').simulate('keydown', getEvent('Enter'));

      const selected = component.find('.selected');

      expect(selected.length).toBe(0);
      expect(onSelectMock).not.toHaveBeenCalled();
    });

    it('should select last when hiting up with no selection', async () => {
      component.find('input').simulate('keydown', getEvent('ArrowUp'));
      const items = component.find('li');

      await expect(items.get(3).props.className).toMatch('selected');
    });

    it('should select first when hiting down with no selection', async () => {
      component.find('input').simulate('keydown', getEvent('ArrowDown'));
      const items = component.find('li');

      await expect(items.get(0).props.className).toMatch('selected');
    });

    it('should navigate up when hiting up with selection', async () => {
      component.find('input').simulate('keydown', getEvent('ArrowUp'));
      component.find('input').simulate('keydown', getEvent('ArrowUp'));

      const items = component.find('li');

      await expect(items.get(2).props.className).toMatch('selected');
    });

    it('should navigate down when hiting down with selection', async () => {
      component.find('input').simulate('keydown', getEvent('ArrowDown'));
      component.find('input').simulate('keydown', getEvent('ArrowDown'));

      const items = component.find('li');

      await expect(items.get(1).props.className).toMatch('selected');
    });

    it('should trigger an event if Enter press with selection', () => {
      component.find('input').simulate('keydown', getEvent('ArrowDown'));
      component.find('input').simulate('keydown', getEvent('Enter'));

      expect(onSelectMock).toHaveBeenCalledWith({
        refId: 'id1',
        label: 'user',
        type: PermissionType.USER,
      });
    });

    it('should hide the dropdown if Esc pressed', () => {
      component.find('input').simulate('keydown', getEvent('Escape'));

      expect(component.find('ul').length).toBe(0);
    });
  });
});
