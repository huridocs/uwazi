describe('SelectPropertyAssignmentCreatorService', () => {
  it.todo('throws if the property name does not exist in the template');

  it.todo('throws if the property is not of type select');

  it.todo('throws if more than one value is provided for a select property');

  it.todo(
    'throws when the provided value does not exist in the referenced thesaurus (including nested/grouped values)'
  );

  it.todo(
    'uses the thesaurus referenced by property.content (by thesaurus id), not by thesaurus value id'
  );

  it.todo('creates one property assignment per language with localized label using translations');

  it.todo('falls back to the base thesaurus label when a translation is missing for a language');

  it.todo(
    'for empty or missing value, creates assignments with an empty value array (select default)'
  );

  it.todo('respects required constraint: throws when select property is required and has no value');

  it.todo('resolves labels for values inside grouped thesauri (nested values)');

  it.todo('does not silently drop unknown/invalid values; returns a descriptive error');
});
