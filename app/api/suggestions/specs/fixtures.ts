import { DBFixture } from 'api/utils/testing_db';

export const fixtures: DBFixture = {
  ixsuggestions: [
    {
      entityId: 'shared1',
      propertyName: 'title',
      suggestedValue: 'Red Robin',
      segment: 'Red Robin, a variation on the traditional Robin persona.',
      language: 'en',
      date: 5,
      page: 2,
    },
    {
      entityId: 'shared1',
      propertyName: 'title',
      suggestedValue: 'HCT-04-CR-SC-0074',
      segment: 'Robin Rojo, una variante del Robin tradicional',
      language: 'es',
      date: 5,
      page: 2,
    },
    {
      entityId: 'shared2',
      propertyName: 'super_powers',
      suggestedValue: 'scientific knowledge',
      segment: 'he relies on his own scientific knowledge',
      language: 'en',
      date: 1,
      page: 5,
    },
    {
      entityId: 'shared2',
      propertyName: 'super_powers',
      suggestedValue: 'conocimiento científico',
      segment: 'el confía en su propio conocimiento científico',
      language: 'es',
      date: 1,
      page: 5,
    },
    {
      entityId: 'shared3',
      propertyName: 'title',
      suggestedValue: 'Alfred Pennyworth',
      segment: "Batman's butler, Alfred Pennyworth",
      language: 'en',
      date: 4,
      page: 3,
    },
    {
      entityId: 'shared3',
      propertyName: 'age',
      suggestedValue: 67,
      segment: 'Alfred 67 years old',
      language: 'en',
      date: 4,
      page: 3,
    },
    {
      entityId: 'shared4',
      propertyName: 'title',
      suggestedValue: 'Joker',
      segment: ' Joker is a homicidal psychopath',
      language: 'en',
      date: 3,
      page: 1,
    },
    {
      entityId: 'shared4',
      propertyName: 'age',
      suggestedValue: 45,
      segment: 'Joker age is 45',
      language: 'en',
      date: 4,
      page: 3,
    },
    {
      entityId: 'shared5',
      propertyName: 'title',
      suggestedValue: 'Poison Ivy',
      segment: 'Poison Ivy is a fictional character appearing in comic books',
      language: 'en',
      date: 6,
      page: 2,
    },
    {
      entityId: 'shared5',
      propertyName: 'age',
      suggestedValue: 25,
      segment: 'Poison Ivy 45 years old',
      language: 'en',
      date: 4,
      page: 3,
    },
    {
      entityId: 'shared6',
      propertyName: 'title',
      suggestedValue: 'Penguin',
      segment: 'The Penguin is a Gotham City mobster.',
      language: 'en',
      date: 2,
      page: 12,
    },
  ],
  entities: [
    {
      sharedId: 'shared1',
      title: 'Robin',
      language: 'en',
    },
    {
      sharedId: 'shared1',
      title: 'Robin es',
      language: 'es',
    },
    {
      sharedId: 'shared2',
      title: 'Batman',
      language: 'en',
      metadata: { super_powers: [{ value: 'scientific knowledge' }] },
    },
    {
      sharedId: 'shared2',
      title: 'Batman es',
      language: 'es',
      metadata: { super_powers: [{ value: 'scientific knowledge' }] },
    },
    { sharedId: 'shared3', title: 'Alfred', language: 'en', metadata: { age: [{ value: '' }] } },
    { sharedId: 'shared4', title: 'Joker', language: 'en' },
    {
      sharedId: 'shared5',
      title: 'Poison Ivy',
      language: 'en',
      metadata: { age: [{ value: 34 }] },
    },
    { sharedId: 'shared6', title: 'The Penguin', language: 'en' },
  ],
};
