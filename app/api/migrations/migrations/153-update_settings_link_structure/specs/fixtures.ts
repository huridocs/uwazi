import { Fixtures } from '../types';

const faultyLinks = [
  {
    //missing title
    type: 'link',
    url: 'an url',
  },
  {
    title: 'missing_type',
    url: 'an url',
  },
  {
    title: 'missing_url',
    type: 'link',
  },
  {
    title: 'extra_local_Id',
    type: 'link',
    url: 'an url',
    localId: 'an id',
  },
  {
    title: 'extra_sublinks',
    type: 'link',
    url: 'an url',
    sublinks: [
      {
        title: 'correct_sublink',
        type: 'link',
        url: 'correct_sublink_url',
      },
    ],
  },
  {
    title: 'bad_type',
    type: 'bad_type',
    url: 'an url',
  },
];

const fixtures: Fixtures = {
  settings: [
    {
      links: [
        {
          title: 'correct_root_link',
          type: 'link',
          url: 'correct_root_link_url',
        },
        {
          title: 'correct_root_group',
          type: 'group',
          sublinks: [
            {
              title: 'correct_sublink',
              type: 'link',
              url: 'correct_sublink_url',
            },
          ],
        },
        ...faultyLinks,
        {
          title: 'correct_group_with_faulty_sublinks',
          type: 'group',
          url: '',
          sublinks: faultyLinks,
        },
        {
          title: 'group_with_extra_localId_and_faulty_sublinks',
          type: 'group',
          url: '',
          localId: 'an id',
          sublinks: faultyLinks,
        },
        {
          //group with missing title
          type: 'group',
          url: '',
          sublinks: [],
        },
        {
          title: 'missing_type',
          url: '',
          sublinks: [],
        },
        {
          title: 'missing_url',
          type: 'group',
          sublinks: [],
        },
        {
          title: 'extra_local_Id',
          type: 'group',
          url: '',
          localId: 'an id',
          sublinks: [],
        },
        {
          title: 'missing sublinks',
          type: 'group',
          url: '',
        },
        {
          title: 'group_with_bad_type',
          type: 'bad_type',
          url: '',
          sublinks: [],
        },
      ],
    },
  ],
};

export { fixtures };
