/* eslint-disable max-lines */

import { ClientTranslationSchema } from '#app/istore.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';

const LOREM_IPSUM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor ' +
  'incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ' +
  'exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure ' +
  'dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ' +
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt ' +
  'mollit anim id est laborum.';

const FILE_ID = '6a0c5def84b3eaec97612d59';
const PERSON_RELATION_TEMPLATE = '6a0c5d0784b3eaec97612923';

const mainEntityDocuments: FileType[] = [
  {
    _id: '1',
    originalname: 'sample.pdf',
    filename: '1.pdf',
    mimetype: 'application/pdf',
    size: 322929,
    creationDate: 1779455251458,
    entity: 'a8txbqrjapn',
    status: 'ready',
    type: 'document',
    generatedToc: false,
    language: 'spa',
    totalPages: 22,
  },
];

const person1EntityData = {
  _id: '6a0c5e0584b3eaec97612df6',
  sharedId: 'a2pe98qmqb',
  template: 'template2',
  title: 'Person 1',
  creationDate: 1779195397083,
  icon: { _id: null, type: 'Empty' },
  metadata: { dob: [{ value: 1777593600 }], gender: [{ value: 'f7c5ffa9', label: 'Male' }] },
  published: true,
  documents: [],
  attachments: [],
};

const person2EntityData = {
  _id: '6a0c5e1084b3eaec97612e32',
  sharedId: 'ncmn4bpr48f',
  template: 'template3',
  title: 'Person 2',
  creationDate: 1779195408571,
  icon: { _id: null, type: 'Empty' },
  metadata: { dob: [{ value: 1777680000 }], gender: [{ value: 'da424edd', label: 'Female' }] },
  published: true,
  documents: [],
  attachments: [],
};

const countryEntityData = {
  _id: '6a0c5e4084b3eaec97612f91',
  sharedId: 'emk9dsxfsx7',
  template: '6a0c5d9084b3eaec97612a3c',
  title: 'Argentina',
  creationDate: 1779195456210,
  icon: { _id: null, type: 'Empty' },
  metadata: {
    geolocation_geolocation: [{ value: { lat: -35.9, lon: -65.0, label: '' } }],
  },
  published: true,
  documents: [],
  attachments: [],
};

type SelectionRectangle = {
  page: number;
  top: number;
  left: number;
  width: number;
  height?: number;
};

type ReferenceFactoryParams = {
  id: number;
  sourceEntitySharedId: string;
  sourceFileId: string;
  targetEntityData: {
    _id: string;
    sharedId: string;
    template: string;
    title: string;
    [key: string]: any;
  };
  relationTemplate: string;
  rectangles: SelectionRectangle[];
  text?: string;
};

const createReference = ({
  id,
  sourceEntitySharedId,
  sourceFileId,
  targetEntityData,
  relationTemplate,
  rectangles,
  text,
}: ReferenceFactoryParams) => {
  const hub = `ref-hub-${id}`;

  const source = {
    template: null,
    _id: `ref-src-${id}`,
    entity: sourceEntitySharedId,
    hub,
    file: sourceFileId,
    reference: {
      selectionRectangles: rectangles.map((rect, i) => ({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height ?? 13.6,
        page: String(rect.page),
        _id: `ref-src-${id}-r${i}`,
      })),
      text: text ?? LOREM_IPSUM,
    },
  };

  const partner = {
    template: relationTemplate,
    entityData: targetEntityData,
    _id: `ref-partner-${id}`,
    entity: targetEntityData.sharedId,
    hub,
  };

  return [source, partner];
};

const buildReferences = () => {
  let id = 0;
  const ref = (
    targetEntityData: ReferenceFactoryParams['targetEntityData'],
    rectangles: SelectionRectangle[],
    text?: string
  ) => {
    const relations = createReference({
      id,
      sourceEntitySharedId: 'ifk5lld93u',
      sourceFileId: FILE_ID,
      targetEntityData,
      relationTemplate: PERSON_RELATION_TEMPLATE,
      rectangles,
      text,
    });
    id += 1;
    return relations;
  };

  return [
    ...ref(person1EntityData, [{ page: 4, top: 62, left: 120, width: 280 }]),
    ...ref(person2EntityData, [{ page: 1, top: 158, left: 108, width: 220 }]),
    ...ref(person1EntityData, [{ page: 17, top: 172, left: 270, width: 190 }]),
    ...ref(person2EntityData, [{ page: 22, top: 188, left: 155, width: 260 }]),
    ...ref(person1EntityData, [
      { page: 9, top: 288, left: 96, width: 450 },
      { page: 9, top: 304, left: 96, width: 220 },
    ]),
    ...ref(person2EntityData, [{ page: 5, top: 408, left: 200, width: 240 }]),
    ...ref(person1EntityData, [{ page: 8, top: 508, left: 130, width: 200 }]),
    ...ref(person2EntityData, [{ page: 8, top: 125, left: 130, width: 200 }]),
    ...ref(person1EntityData, [{ page: 8, top: 715, left: 130, width: 200 }]),
    ...ref(person1EntityData, [{ page: 8, top: 702, left: 118, width: 214 }]),
    ...ref(person1EntityData, [{ page: 8, top: 728, left: 142, width: 188 }]),
    ...ref(person1EntityData, [{ page: 8, top: 94, left: 136, width: 224 }]),
    ...ref(person1EntityData, [{ page: 8, top: 39, left: 124, width: 176 }]),
    ...ref(person1EntityData, [{ page: 8, top: 721, left: 150, width: 206 }]),
    ...ref(person1EntityData, [{ page: 8, top: 710, left: 112, width: 196 }]),
    ...ref(person1EntityData, [{ page: 8, top: 748, left: 140, width: 168 }]),
    ...ref(person1EntityData, [{ page: 8, top: 689, left: 128, width: 236 }]),
    ...ref(person1EntityData, [{ page: 8, top: 133, left: 116, width: 186 }]),
    ...ref(person1EntityData, [{ page: 8, top: 706, left: 145, width: 209 }]),
    ...ref(person1EntityData, [{ page: 8, top: 742, left: 122, width: 193 }]),
    ...ref(person1EntityData, [{ page: 8, top: 697, left: 138, width: 218 }]),
    ...ref(person1EntityData, [{ page: 8, top: 926, left: 126, width: 182 }]),
    ...ref(person1EntityData, [{ page: 8, top: 713, left: 154, width: 201 }]),
    ...ref(person1EntityData, [{ page: 8, top: 736, left: 120, width: 172 }]),
    ...ref(person1EntityData, [{ page: 8, top: 200, left: 134, width: 228 }]),
    ...ref(person1EntityData, [{ page: 8, top: 744, left: 148, width: 184 }]),
    ...ref(person1EntityData, [{ page: 8, top: 691, left: 114, width: 220 }]),
    ...ref(person1EntityData, [{ page: 8, top: 730, left: 139, width: 192 }]),
    ...ref(person1EntityData, [{ page: 8, top: 708, left: 121, width: 212 }]),
    ...ref(person1EntityData, [{ page: 8, top: 346, left: 132, width: 174 }]),
    ...ref(person1EntityData, [{ page: 8, top: 699, left: 146, width: 205 }]),
    ...ref(person2EntityData, [{ page: 21, top: 518, left: 290, width: 175 }]),
    ...ref(person1EntityData, [{ page: 11, top: 528, left: 210, width: 310 }]),
    ...ref(person2EntityData, [{ page: 20, top: 537, left: 145, width: 255 }]),
    ...ref(person1EntityData, [{ page: 18, top: 546, left: 350, width: 185 }]),
    ...ref(person2EntityData, [{ page: 16, top: 668, left: 180, width: 215 }]),
    ...ref(person1EntityData, [{ page: 19, top: 758, left: 160, width: 280 }]),
    ...ref(person2EntityData, [{ page: 22, top: 771, left: 305, width: 195 }]),
    ...ref(person1EntityData, [{ page: 22, top: 782, left: 120, width: 340 }]),
    ...ref(person2EntityData, [{ page: 7, top: 794, left: 190, width: 230 }]),
    ...ref(person1EntityData, [{ page: 14, top: 898, left: 140, width: 260 }]),
    ...ref(person2EntityData, [{ page: 15, top: 978, left: 335, width: 180 }]),
    ...ref(person1EntityData, [{ page: 21, top: 998, left: 175, width: 300 }]),
  ];
};

const generatedReferences = buildReferences();

const relationships = [
  {
    template: '6a0c5d0084b3eaec97612911',
    entityData: countryEntityData,
    _id: 'static-rel-country-1',
    entity: countryEntityData.sharedId,
    hub: 'static-hub-country-1',
  },
  {
    template: '6a0c5d0084b3eaec97612911',
    entityData: person1EntityData,
    _id: 'static-rel-person-1',
    entity: person1EntityData.sharedId,
    hub: 'static-hub-person-1',
  },
];

const apiEntity: Entity = {
  _id: '1',
  language: 'en',
  sharedId: 'entity1',
  template: 'template1',
  user: 'user1',
  title: 'AMIA Informe Nº 187 20',
  creationDate: 1,
  editDate: 2,
  icon: { _id: '', type: 'Empty', label: '' },
  metadata: {},
  published: true,
  documents: mainEntityDocuments,
  attachments: [],
  relations: [...relationships, ...generatedReferences],
};

const templates = [
  {
    _id: 'template1',
    color: '#6a5acd',
    name: 'Documents',
    default: true,
    commonProperties: [
      { _id: '1.1', type: 'text', label: 'Title', name: 'title' },
      { _id: '1.2', type: 'date', label: 'Date added', name: 'creationDate' },
      { _id: '1.3', type: 'date', label: 'Date modified', name: 'editDate' },
    ],
    properties: [],
  },
  {
    _id: 'template2',
    color: '#faca15',
    name: 'Person',
    default: false,
    commonProperties: [
      { _id: '2.1', type: 'text', label: 'Title', name: 'title' },
      { _id: '2.2', type: 'date', label: 'Date added', name: 'creationDate' },
      { _id: '2.3', type: 'date', label: 'Date modified', name: 'editDate' },
    ],
    properties: [],
  },
  {
    _id: 'template3',
    color: '#2b8a3e',
    name: 'Country',
    default: false,
    commonProperties: [
      { _id: '3.1', type: 'text', label: 'Title', name: 'title' },
      { _id: '3.2', type: 'date', label: 'Date added', name: 'creationDate' },
      { _id: '3.3', type: 'date', label: 'Date modified', name: 'editDate' },
    ],
    properties: [],
  },
] as ClientTemplateSchema[];

const translations = [
  {
    locale: 'en',
    contexts: [
      {
        id: 'System',
        label: 'User Interface',
        type: 'Uwazi UI',
        values: { References: 'References', 'Current page': 'Current page' },
      },
    ],
  },
  {
    locale: 'es',
    contexts: [
      {
        id: 'System',
        label: 'User Interface',
        type: 'Uwazi UI',
        values: { References: 'Referencias', 'Current page': 'Página actual' },
      },
    ],
  },
] as ClientTranslationSchema[];

export { apiEntity, templates, translations };
