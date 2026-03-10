import db from 'api/utils/testing_db';

const fixtures = {
  templates: [
    {
      _id: db.id(),
      name: 'Template with ID',
      properties: [
        {
          nestedProperties: [],
          _id: db.id(),
          label: 'Text property 1',
          type: 'text',
          name: 'text_property_1',
          id: '28d6d959-8857-4795-93a8-d2c238892d11',
        },
        {
          nestedProperties: [],
          _id: db.id(),
          relationType: '5ab249565771f9ee361459f4',
          label: 'Related',
          type: 'relationship',
          content: '58ada34c299e826748545059',
          filter: true,
          name: 'related',
          id: 'a4433733-2e78-44f2-9ea6-669177fcd24e',
        },
      ],
      default: true,
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: db.id(),
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
    },
    {
      _id: db.id(),
      name: 'Template with ID and localID',
      properties: [
        {
          _id: db.id(),
          nestedProperties: [],
          relationType: '5ab249575771f9ee36145a24',
          label: 'Related',
          type: 'relationship',
          content: '58ada34c299e82674854504b',
          filter: true,
          name: 'related',
          id: 'd87fc211-2e41-4fa8-bc4f-7fa94392bf36',
          localID: 'srhkbn1bbqi',
        },
        {
          _id: db.id(),
          nestedProperties: [],
          label: 'Type',
          type: 'multiselect',
          filter: true,
          content: '58ada34c299e8267485450fb',
          name: 'type',
          id: '3ab740ff-08ce-49fc-a1d5-c113d82cbb7e',
          localID: 'qqrjdncq9s',
        },
        {
          _id: db.id(),
          label: 'Markdown',
          type: 'markdown',
          localID: 'o6kr1gwz4u',
          name: 'markdown',
          id: '6ff0d487-554d-43d6-877d-e4fcfc7cec9d',
        },
      ],
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: db.id(),
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
      color: '#8BC34A',
    },
    {
      _id: db.id(),
      name: 'Sanitezed template',
      properties: [
        {
          nestedProperties: [],
          _id: db.id(),
          label: 'Text property',
          type: 'text',
          name: 'text',
        },
      ],
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: db.id(),
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
    },
    {
      _id: db.id(),
      name: 'Template with no props',
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: db.id(),
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
    },
    {
      _id: db.id(),
      name: 'template with empty props',
      commonProperties: [
        {
          _id: db.id(),
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
          prioritySorting: false,
        },
        {
          _id: db.id(),
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
          prioritySorting: false,
        },
      ],
      properties: [],
    },
  ],
};

export { fixtures };
