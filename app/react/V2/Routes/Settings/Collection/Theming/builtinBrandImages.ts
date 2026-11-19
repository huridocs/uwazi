import type { FileType } from '#shared/types/fileType.js';

const brandFile = (name: string, url: string, mimetype: string): FileType => ({
  filename: url,
  originalname: name,
  url,
  mimetype,
  type: 'custom',
});

const UWAZI_DEFAULT_LOGOS: FileType[] = [
  brandFile('Uwazi Design', '/public/uwazi-design-logo.svg', 'image/svg+xml'),
];

const UWAZI_DEFAULT_FAVICONS: FileType[] = [
  brandFile('Uwazi Design', '/public/uwazi-design-icon-light.png', 'image/png'),
];

export { UWAZI_DEFAULT_FAVICONS, UWAZI_DEFAULT_LOGOS };
