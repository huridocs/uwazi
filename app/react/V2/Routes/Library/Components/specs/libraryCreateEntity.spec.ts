import {
  blankLibraryEntity,
  defaultLibraryTemplateId,
  toNewEntitySaveInput,
} from '../libraryCreateEntity.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';

describe('libraryCreateEntity', () => {
  it('prefers the default template', () => {
    expect(defaultLibraryTemplateId([{ _id: 'a' }, { _id: 'b', default: true }])).toBe('b');
  });

  it('builds an empty entity for the create form', () => {
    expect(blankLibraryEntity('template1', 'en')).toEqual({
      _id: '',
      sharedId: '',
      title: '',
      template: 'template1',
      language: 'en',
      creationDate: 0,
      user: '',
    });
  });

  it('strips empty identity fields so save creates a new entity', () => {
    const input = {
      _id: '',
      sharedId: '',
      title: 'Paella',
      template: 'template1',
      language: 'en',
      user: '',
      creationDate: 0,
    } as EntitySaveInput;

    expect(toNewEntitySaveInput(input)).toEqual({
      title: 'Paella',
      template: 'template1',
      language: 'en',
    });
  });
});
