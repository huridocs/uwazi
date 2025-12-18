import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';

export const factory = getFixturesFactory();

export const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { label: 'English', key: 'en', default: true },
        { label: 'Spanish', key: 'es' },
      ],
    },
  ],

  templates: [
    factory.template(
      'template_1',
      [
        factory.property('select', 'select', {
          content: factory.id('countries').toHexString(),
        }),
        factory.property('multiselect', 'multiselect', {
          content: factory.id('countries').toHexString(),
        }),
        factory.property('text', 'text'),
      ],
      { default: true }
    ),

    factory.template('template_2', [
      factory.inherit('relationship_1', 'template_1', 'select', {
        relationType: factory.id('rel1').toHexString(),
        inherit: {
          type: 'select',
          property: factory.id('select').toString(),
        },
      }),
      factory.property('select', 'select', {
        content: factory.id('countries').toHexString(),
      }),
    ]),

    factory.template('template_3', [
      factory.property('select', 'select', {
        content: factory.id('thesaurus_2').toHexString(),
      }),
      factory.property('multiselect', 'multiselect', {
        content: factory.id('thesaurus_2').toHexString(),
      }),
    ]),

    factory.template('template_4', [
      factory.inherit('relationship_to_t1', 'template_1', 'multiselect', {
        relationType: factory.id('rel2').toHexString(),
        inherit: {
          type: 'multiselect',
          property: factory.id('multiselect').toString(),
        },
      }),
      factory.inherit('relationship_to_t3', 'template_3', 'select', {
        relationType: factory.id('rel3').toHexString(),
      }),
    ]),
  ],

  entities: [
    // Template 1
    factory.entity(
      'entity_1',
      'template_1',
      {
        select: [{ value: factory.id('countries_canada').toString(), label: 'Canada V1' }],
        multiselect: [{ value: factory.id('countries_france').toString(), label: 'France V1' }],
        text: [{ value: 'text en' }],
      },
      { language: 'en' }
    ),
    factory.entity(
      'entity_1',
      'template_1',
      {
        select: [{ value: factory.id('countries_canada').toString(), label: 'Canada ES V1' }],
        multiselect: [{ value: factory.id('countries_france').toString(), label: 'France ES V1' }],
        text: [{ value: 'text es' }],
      },
      { language: 'es' }
    ),

    factory.entity(
      'entity_2',
      'template_1',
      {
        multiselect: [{ value: factory.id('countries_france').toString(), label: 'France V1' }],
        text: [{ value: 'text en' }],
      },
      { language: 'en' }
    ),
    factory.entity(
      'entity_2',
      'template_1',
      {
        multiselect: [{ value: factory.id('countries_france').toString(), label: 'France ES V1' }],
        text: [{ value: 'text es' }],
      },
      { language: 'es' }
    ),

    // Template 2
    factory.entity(
      'entity_3',
      'template_2',
      {
        select: [{ value: factory.id('countries_france').toString(), label: 'France V1' }],
        relationship_1: [
          {
            value: 'entity_1',
            label: 'entity_1',
            inheritedValue: [
              { value: factory.id('countries_canada').toString(), label: 'Canada V1' },
            ],
          },
        ],
      },
      { language: 'en' }
    ),
    factory.entity(
      'entity_3',
      'template_2',
      {
        select: [{ value: factory.id('countries_france').toString(), label: 'France ES V1' }],
        relationship_1: [
          {
            value: 'entity_1',
            label: 'entity_1',
            inheritedValue: [
              { value: factory.id('countries_canada').toString(), label: 'Canada ES V1' },
            ],
          },
        ],
      },
      { language: 'es' }
    ),

    // Template 3 (no relationships, different thesaurus)
    factory.entity(
      'entity_4',
      'template_3',
      {
        select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' }],
        multiselect: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' }],
      },
      { language: 'en' }
    ),
    factory.entity(
      'entity_4',
      'template_3',
      {
        select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' }],
        multiselect: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' }],
      },
      { language: 'es' }
    ),

    // Template 4 (with relationships to both template_1 and template_3)
    factory.entity(
      'entity_5',
      'template_4',
      {
        relationship_to_t1: [
          {
            value: 'entity_1',
            label: 'entity_1',
            inheritedValue: [
              { value: factory.id('countries_france').toString(), label: 'France V1' },
            ],
          },
        ],
        relationship_to_t3: [
          {
            value: 'entity_4',
            label: 'entity_4',
            inheritedValue: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' }],
          },
        ],
      },
      { language: 'en' }
    ),
    factory.entity(
      'entity_5',
      'template_4',
      {
        relationship_to_t1: [
          {
            value: 'entity_1',
            label: 'entity_1',
            inheritedValue: [
              { value: factory.id('countries_france').toString(), label: 'France ES V1' },
            ],
          },
        ],
        relationship_to_t3: [
          {
            value: 'entity_4',
            label: 'entity_4',
            inheritedValue: [
              { value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' },
            ],
          },
        ],
      },
      { language: 'es' }
    ),
  ],

  dictionaries: [
    {
      _id: factory.id('countries'),
      name: 'Countries',
      values: [
        { id: factory.id('countries_canada').toString(), label: 'Canada' },
        { id: factory.id('countries_france').toString(), label: 'France' },
      ],
    },
    {
      _id: factory.id('thesaurus_2'),
      name: 'thesaurus_2',
      values: [{ id: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
    },
  ],

  relationtypes: [
    {
      _id: factory.id('rel1'),
      name: 'rel1',
    },
    {
      _id: factory.id('rel2'),
      name: 'rel2',
    },
    {
      _id: factory.id('rel3'),
      name: 'rel3',
    },
  ],

  connections: [
    {
      _id: factory.id('connection_entity3_entity1_1'),
      entity: 'entity_3',
      hub: factory.id('hub_entity3_entity1'),
      template: factory.id('rel1'),
    },
    {
      _id: factory.id('connection_entity3_entity1_2'),
      entity: 'entity_1',
      hub: factory.id('hub_entity3_entity1'),
      template: factory.id('rel1'),
    },
    {
      _id: factory.id('connection_entity5_entity1_1'),
      entity: 'entity_5',
      hub: factory.id('hub_entity5_entity1'),
      template: factory.id('rel2'),
    },
    {
      _id: factory.id('connection_entity5_entity1_2'),
      entity: 'entity_1',
      hub: factory.id('hub_entity5_entity1'),
      template: factory.id('rel2'),
    },
    {
      _id: factory.id('connection_entity5_entity4_1'),
      entity: 'entity_5',
      hub: factory.id('hub_entity5_entity4'),
      template: factory.id('rel3'),
    },
    {
      _id: factory.id('connection_entity5_entity4_2'),
      entity: 'entity_4',
      hub: factory.id('hub_entity5_entity4'),
      template: factory.id('rel3'),
    },
  ],
};
