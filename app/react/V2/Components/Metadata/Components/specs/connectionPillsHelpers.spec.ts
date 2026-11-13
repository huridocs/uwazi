import { sharedRelationshipTemplateId, sortRelationshipValues } from '../connectionPillsHelpers.js';
import type { RelationshipEntityValue } from '../connectionPillsHelpers.js';

const entity = (title: string, templateId?: string, id = title): RelationshipEntityValue => ({
  _id: id,
  title,
  ...(templateId ? { templateId } : {}),
});

describe('connectionPillsHelpers', () => {
  it('sorts titles alphabetically, case-insensitive', () => {
    const sorted = sortRelationshipValues([
      entity('zeta'),
      entity('Alpha'),
      entity('beta'),
      entity('álvaro'),
    ]);
    expect(sorted.map(value => value.title)).toEqual(['Alpha', 'álvaro', 'beta', 'zeta']);
  });

  it('returns the shared template when every value resolves to the same one', () => {
    expect(
      sharedRelationshipTemplateId([entity('A', 'tmpl-a'), entity('B', 'tmpl-a')], 'tmpl-fallback')
    ).toBe('tmpl-a');
    expect(sharedRelationshipTemplateId([entity('A'), entity('B')], 'tmpl-fallback')).toBe(
      'tmpl-fallback'
    );
  });

  it('returns undefined when templates mix or none resolve', () => {
    expect(
      sharedRelationshipTemplateId([entity('A', 'tmpl-a'), entity('B', 'tmpl-b')])
    ).toBeUndefined();
    expect(sharedRelationshipTemplateId([entity('A'), entity('B')])).toBeUndefined();
    expect(sharedRelationshipTemplateId([])).toBeUndefined();
  });
});
