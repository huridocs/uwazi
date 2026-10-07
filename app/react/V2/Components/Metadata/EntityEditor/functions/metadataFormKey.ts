const ESCAPE: Record<string, string> = {
  '~': '~7e',
  '.': '~2e',
  '[': '~5b',
  ']': '~5d',
  "'": '~27',
  '"': '~22',
};

const metadataFormKey = (name: string) => name.replace(/[~.[\]'"]/g, char => ESCAPE[char] ?? char);

const metadataFormPath = (name: string): `metadata.${string}` =>
  `metadata.${metadataFormKey(name)}`;

export { metadataFormKey, metadataFormPath };
