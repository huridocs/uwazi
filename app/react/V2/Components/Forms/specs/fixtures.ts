import { MultiselectListOption } from '..';

const pizzas: MultiselectListOption[] = [
  { label: 'Margherita', value: 'MGT', searchLabel: 'Margherita' },
  { label: 'Pepperoni', value: 'PPR', searchLabel: 'Pepperoni' },
  { label: 'Hawaiian', value: 'HWN', searchLabel: 'Hawaiian' },
  { label: 'Vegetarian', value: 'VGT', searchLabel: 'Vegetarian' },
  { label: 'Meat Lovers', value: 'MLV', searchLabel: 'Meat Lovers' },
  { label: 'BBQ Chicken', value: 'BQC', searchLabel: 'BBQ Chicken' },
  { label: 'Mushroom', value: 'MSH', searchLabel: 'Mushroom' },
  { label: 'Four Cheese', value: 'FC', searchLabel: 'Four Cheese' },
  { label: 'Buffalo Chicken', value: 'BFC', searchLabel: 'Buffalo Chicken' },
  { label: 'Chicken Bacon Ranch', value: 'CBR', searchLabel: 'Chicken Bacon Ranch' },
  { label: 'Chicken Alfredo', value: 'CAF', searchLabel: 'Chicken Alfredo' },
];

const salads = [
  {
    label: 'Veggy',
    searchLabel: 'Veggy',
    value: 'veggy',
    items: [
      { label: 'Caesar', value: 'veggy_caesar', searchLabel: 'caesar' },
      { label: 'Mediterranean', value: 'veggy_medit', searchLabel: 'mediterranean' },
      { label: 'Tai', value: 'tai', searchLabel: 'tai' },
    ],
  },
  {
    label: 'Vegan',
    searchLabel: 'Vegan',
    value: 'vegan',
    items: [
      { label: 'Caesar', value: 'vegan_caesar', searchLabel: 'caesar' },
      { label: 'Mediterranean', value: 'vegan_medit', searchLabel: 'mediterranean' },
      { label: 'Rice', value: 'rice', searchLabel: 'rice' },
    ],
  },
  {
    label: 'Regular',
    searchLabel: 'Regular',
    value: 'regular',
    items: [
      { label: 'Caesar', value: 'caesar', searchLabel: 'caesar' },
      { label: 'Mediterranean', value: 'medit', searchLabel: 'mediterranean' },
      { label: 'Super', value: 'super', searchLabel: 'super' },
    ],
  },
];

const specialCharacters = [
  { label: 'Pénélope', value: '1', searchLabel: 'Pénélope' },
  { label: 'Maïté', value: '2', searchLabel: 'Maïté' },
  {
    label: 'Penelopee',
    value: '3',
    searchLabel: 'Penelopee',
  },
  {
    label: '美琳',
    value: '4',
    searchLabel: '美琳',
  },
  {
    label: '银含',
    value: '66435-410',
    searchLabel: '银含',
  },
  {
    label: 'Loïca',
    value: '67877-171',
    searchLabel: 'Loïca',
  },
  {
    label: 'Åslög',
    value: '16590-492',
    searchLabel: 'Åslög',
  },
  { label: 'Татьяна', value: '16291-462', searchLabel: 'Татьяна' },
  {
    label: 'Hélèna',
    value: '49939-201',
    searchLabel: 'Hélèna',
  },
  {
    label: 'oakley.com',
    value: '0378-4202',
    searchLabel: 'oakley.com',
  },
];

export { pizzas, salads, specialCharacters };
