const BasicData = [
  { title: 'Entity 2', created: 2, description: 'Short text' },
  {
    title: 'Entity 1',
    created: 1,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
    children: [
      {
        title: 'Entity a',
        created: 4,
        description: 'Donec feugiat at libero at rutrum.',
      },
      {
        title: 'Entity b',
        created: 5,
        description: 'Phasellus vel efficitur quam.',
      },
    ],
  },
  {
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
  },
];

const LongData = [
  { title: 'Entity 5', created: 5, description: 'Lorem ipsum dolor sit amet' },
  { title: 'Entity 14', created: 14, description: 'Consectetur adipiscing elit' },
  { title: 'Entity 19', created: 19, description: 'Sed do eiusmod tempor' },
  { title: 'Entity 13', created: 13, description: 'Incididunt ut labore et' },
  { title: 'Entity 16', created: 16, description: 'Dolore magna aliqua' },
  { title: 'Entity 8', created: 8, description: 'Ut enim ad minim veniam' },
  { title: 'Entity 1', created: 1, description: 'Quis nostrud exercitation' },
  { title: 'Entity 10', created: 10, description: 'Ullamco laboris nisi ut' },
  { title: 'Entity 15', created: 15, description: 'Aliquip ex ea commodo' },
  { title: 'Entity 2', created: 2, description: 'Duis aute irure dolor' },
  { title: 'Entity 17', created: 17, description: 'Reprehenderit in voluptate' },
  { title: 'Entity 4', created: 4, description: 'Velit esse cillum dolore' },
  { title: 'Entity 12', created: 12, description: 'Eu fugiat nulla pariatur' },
  { title: 'Entity 6', created: 6, description: 'Excepteur sint occaecat' },
  { title: 'Entity 7', created: 7, description: 'Cupidatat non proident' },
  { title: 'Entity 3', created: 3, description: 'Sunt in culpa qui officia' },
  { title: 'Entity 11', created: 11, description: 'Deserunt mollit anim id' },
  { title: 'Entity 20', created: 20, description: 'Est laborum et dolorum' },
  { title: 'Entity 9', created: 9, description: 'Fuga enim quidem' },
  { title: 'Entity 18', created: 18, description: 'Nemo enim ipsam voluptatem' },
];

export { BasicData, LongData };
