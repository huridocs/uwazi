import { MultiselectListOption } from 'V2/Components/Forms';

const items = [
  { searchLabel: 'Someone', label: 'Someone', value: 'someone' },
  { searchLabel: 'Another', label: 'Another', value: 'another' },
  { searchLabel: 'Another name', label: 'Another name', value: 'another name' },
  { searchLabel: 'And another', label: 'And another', value: 'and another' },
  { searchLabel: 'Item A', label: 'Item A', value: 'item1' },
  { searchLabel: 'Item B', label: 'Item B', value: 'item2' },
  { searchLabel: 'Item C', label: 'Item C', value: 'item3' },
  { searchLabel: 'Item F', label: 'Item F', value: 'item4' },
  { searchLabel: 'Item G', label: 'Item G', value: 'item5' },
  { searchLabel: 'Item E', label: 'Item E', value: 'item6' },
  { searchLabel: 'Item I', label: 'Item I', value: 'item7' },
  { searchLabel: 'Item J', label: 'Item J', value: 'item8' },
  { searchLabel: 'Item H', label: 'Item H', value: 'item9' },
  {
    searchLabel: 'Item with extra extra extra long name 1',
    label: 'Item with extra extra extra long name 1',
    value: 'lItem1',
  },
  {
    searchLabel: 'Item with ëxtra extra extra long name 2',
    label: 'Item with extra ëxtra extra long name 2',
    value: 'lItem2',
  },

  {
    searchLabel: 'Item with extra extra extra extra extraextraextra long name',
    label: 'Item with extra extra extra extra extraextraextra long name',
    value: 'xlItem',
  },
];

const remoteLookupFunction = async (search: string): Promise<MultiselectListOption[]> =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve(
        items.filter(({ searchLabel }) => searchLabel?.toLowerCase().includes(search.toLowerCase()))
      );
    }, 1000);
  });

export { items, remoteLookupFunction };
