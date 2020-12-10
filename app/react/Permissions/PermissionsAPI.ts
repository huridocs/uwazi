import { MemberWithPermission } from './EntityPermisions';

export const searchMembers = async (value: string): Promise<MemberWithPermission[]> =>
  new Promise(resolve => {
    const data: MemberWithPermission[] = [
      {
        type: 'user',
        id: 'id1',
        label: 'User name 1',
        role: 'admin',
      },
      {
        type: 'group',
        id: 'id1',
        label: 'Group name 1',
      },
      {
        type: 'group',
        id: 'id2',
        label: 'Group name 2',
      },
      {
        type: 'user',
        id: 'id2',
        label: 'User name 2',
        role: 'editor',
      },
      {
        type: 'user',
        id: 'id3',
        label: 'User name 3',
        role: 'contributor',
      },
      {
        type: 'user',
        id: 'id4',
        label: 'User name 4',
        role: 'admin',
      },
      {
        type: 'group',
        id: 'id3',
        label: 'Group name 3',
      },
      {
        type: 'group',
        id: 'id4',
        label: 'Group name 4',
      },
      {
        type: 'user',
        id: 'id5',
        label: 'User name 5',
        role: 'editor',
      },
      {
        type: 'user',
        id: 'id6',
        label: 'User name 6',
        role: 'contributor',
      },
      {
        type: 'user',
        id: 'id7',
        label: 'User name 7',
        role: 'admin',
      },
      {
        type: 'group',
        id: 'id5',
        label: 'Group name 5',
      },
      {
        type: 'group',
        id: 'id6',
        label: 'Group name 6',
      },
      {
        type: 'user',
        id: 'id8',
        label: 'User name 8',
        role: 'editor',
      },
      {
        type: 'user',
        id: 'id9',
        label: 'User name 9',
        role: 'contributor',
      },
    ];

    resolve(value ? data.filter(elem => elem.label.includes(value)) : []);
  });
