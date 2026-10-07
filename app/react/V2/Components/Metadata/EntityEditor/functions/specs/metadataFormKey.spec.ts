import { formatMetadataForEntity } from '../editEntityMetadata.js';
import { formatMetadataForForm } from '../formatMetadataForForm.js';
import { metadataFormKey } from '../metadataFormKey.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';

const pathSegments = (path: string) => path.split(/[.[\]'"]/).filter(Boolean);

describe('metadataFormKey', () => {
  it('leaves path-safe names unchanged', () => {
    expect(metadataFormKey('hrd_bio_and_work')).toBe('hrd_bio_and_work');
  });

  it('escapes only the characters react-hook-form would split', () => {
    const name = "hrd's_bio_and_work";
    const key = metadataFormKey(name);
    const segments = pathSegments(`metadata.${key}.0.value`);

    expect(key).toBe('hrd~27s_bio_and_work');
    expect(segments).toEqual(['metadata', key, '0', 'value']);
    expect(metadataFormKey('a.b')).toBe('a~2eb');
    expect(metadataFormKey('a[b]')).toBe('a~5bb~5d');
    expect(metadataFormKey('say "hi"')).toBe('say ~22hi~22');
  });

  it('escapes a tilde so an encoded key is not another property name', () => {
    expect(metadataFormKey('hrd~27s_bio_and_work')).toBe('hrd~7e27s_bio_and_work');
  });

  it('round-trips a markdown value whose property name contains an apostrophe', () => {
    const name = "hrd's_bio_and_work";
    const property: FormMetadataProperty = {
      _id: 'bio',
      type: 'markdown',
      name,
      label: "HRD's bio and work",
    };
    const entityMetadata = { [name]: [{ value: 'Mohamed Yousfi is a Tunisian journalist.' }] };
    const formMetadata = formatMetadataForForm([property], entityMetadata);
    const key = metadataFormKey(name);

    expect(formMetadata[key]?.[0]?.value).toBe('Mohamed Yousfi is a Tunisian journalist.');
    expect(formMetadata[name]).toBeUndefined();
    expect(formatMetadataForEntity(formMetadata, [property])?.[name]).toEqual(entityMetadata[name]);
  });
});
