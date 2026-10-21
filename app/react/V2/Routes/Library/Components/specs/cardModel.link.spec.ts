import type { Template } from '#app/apiResponseTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import { metadataFieldsForCard } from '../cardModel.js';

const context = { ...metadataDisplayPresets.compact, locale: 'en' };

describe('metadataFieldsForCard link property', () => {
  it('includes a showInCard link as a labeled external link', () => {
    const linkTemplate = {
      _id: 'tmpl1',
      name: 'Hearing',
      properties: [
        { _id: 'p-link', name: 'website', label: 'Link', type: 'link', showInCard: true },
      ],
    } as Template;
    const withLink: Entity = {
      _id: 'e1',
      sharedId: 's1',
      title: 'Hearing',
      template: 'tmpl1',
      language: 'en',
      creationDate: 1,
      user: 'u1',
      metadata: { website: [{ value: { label: 'google', url: 'https://google.com' } }] },
    };
    expect(metadataFieldsForCard(withLink, linkTemplate, { context })).toEqual([
      {
        id: 'website',
        label: 'Link',
        value: 'google',
        interactive: false,
        links: [{ label: 'google', href: 'https://google.com' }],
      },
    ]);
  });
});
