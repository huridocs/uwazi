/**
 * @jest-environment jsdom
 */
import type { Template } from '#app/apiResponseTypes.js';
import { libraryTableColumnGroups } from '../libraryTableColumns.js';

const templates = [
  {
    _id: 'tpl-org',
    name: 'Organization',
    color: '#6a5acd',
    properties: [
      {
        _id: 'p1',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'thesaurus-countries',
      },
      { _id: 'p2', name: 'type', label: 'Type', type: 'select', content: 'thesaurus-types' },
      { _id: 'p3', name: 'location', label: 'Location', type: 'geolocation' },
      { _id: 'p4', name: 'video', label: 'Video', type: 'media' },
    ],
  },
  {
    _id: 'tpl-person',
    name: 'Person',
    color: '#faca15',
    properties: [
      {
        _id: 'p5',
        name: 'country',
        label: 'Country',
        type: 'select',
        content: 'thesaurus-countries',
      },
      { _id: 'p6', name: 'role', label: 'Role', type: 'text' },
    ],
  },
  {
    _id: 'tpl-event',
    name: 'Event',
    color: '#2b8a3e',
    properties: [
      { _id: 'p7', name: 'country', label: 'Country', type: 'select', content: 'thesaurus-other' },
      { _id: 'p8', name: 'date', label: 'Event date', type: 'date' },
    ],
  },
] as Template[];

const columnIds = (groups: ReturnType<typeof libraryTableColumnGroups>) =>
  groups.map(group => ({
    id: group.id,
    templateId: group.templateId,
    columns: group.columns.map(column => column.id),
  }));

describe('libraryTableColumnGroups', () => {
  it('keeps only built-ins at the top and lists every property under its template', () => {
    expect(columnIds(libraryTableColumnGroups(templates, ['tpl-org']))).toEqual([
      {
        id: 'builtins',
        columns: ['title', 'template', 'creationDate', 'editDate'],
      },
      {
        id: 'template:tpl-org',
        templateId: 'tpl-org',
        columns: ['country', 'type', 'location', 'video'],
      },
    ]);
  });

  it('repeats shared properties under each template instead of a common group', () => {
    expect(columnIds(libraryTableColumnGroups(templates, ['tpl-org', 'tpl-person']))).toEqual([
      {
        id: 'builtins',
        columns: ['title', 'template', 'creationDate', 'editDate'],
      },
      {
        id: 'template:tpl-org',
        templateId: 'tpl-org',
        columns: ['country', 'type', 'location', 'video'],
      },
      {
        id: 'template:tpl-person',
        templateId: 'tpl-person',
        columns: ['country', 'role'],
      },
    ]);
  });

  it('lists every visualized template when none are selected', () => {
    expect(columnIds(libraryTableColumnGroups(templates, []))).toEqual([
      {
        id: 'builtins',
        columns: ['title', 'template', 'creationDate', 'editDate'],
      },
      {
        id: 'template:tpl-org',
        templateId: 'tpl-org',
        columns: ['country', 'type', 'location', 'video'],
      },
      {
        id: 'template:tpl-person',
        templateId: 'tpl-person',
        columns: ['country', 'role'],
      },
      {
        id: 'template:tpl-event',
        templateId: 'tpl-event',
        columns: ['country', 'date'],
      },
    ]);
  });
});
