// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/templateTyp... Remove this comment to see the full error message
import { TemplateSchema } from 'shared/types/templateType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/thesaurusTy... Remove this comment to see the full error message
import { ThesaurusSchema } from 'shared/types/thesaurusType.js';

export const thesauri: ThesaurusSchema[] = [
  {
    _id: 'abc',
    name: 'thesaurus1',
    values: [
      { id: 'v1', label: 'V1' },
      { id: 'v2', label: 'V2' },
    ],
  },
];
export const templates: TemplateSchema[] = [
  {
    _id: 't1',
    name: 'template1',
    commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    properties: [{ name: 'opts', label: 'Opts', content: 'abc', type: 'multiselect' }],
  },
];
export const documents: EntitySchema[] = [
  {
    _id: 'e1i',
    template: 't1',
    sharedId: 'e1',
    metadata: { title: [{ value: 'Doc1' }], opts: [{ value: 'v1', label: 'V1' }] },
  },
  {
    _id: 'e2i',
    template: 't1',
    sharedId: 'e2',
    metadata: { title: [{ value: 'Doc2' }], opts: [{ value: 'v2', label: 'V2' }] },
  },
];

export const contentForFiles = {
  text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam metus lorem, imperdiet vel lacus a, dictum laoreet est.',
  image:
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBYWFRgWFhYYGBgaGh4cHBwaGRwaHh4dHB4azcGhoaHBwcIS4lHR8sExMT8xND8/a+A9LY+A+t/QhAIQhAIQahB//Z',
};
