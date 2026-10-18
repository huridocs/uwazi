const ACTIVE_EXTENSIONS = new Set(['html', 'htm', 'xhtml', 'svg', 'svgz', 'xml', 'js', 'mjs']);

const ACTIVE_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'image/svg',
  'text/xml',
  'application/xml',
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'text/ecmascript',
  'application/ecmascript',
]);

const SVG_EXTENSIONS = new Set(['svg', 'svgz']);

const SVG_MIME_TYPES = new Set(['image/svg+xml', 'image/svg']);

const ACTIVE_CONTENT_CSP = "sandbox; default-src 'none'; script-src 'none'; object-src 'none'";

type FileDownloadHeaderInput = {
  storedFilename: string;
  originalFilename: string;
  mimetype?: string;
  download?: boolean;
};

type FileDownloadHeaders = {
  contentDisposition: string;
  contentType: string;
  contentSecurityPolicy?: string;
};

const mediaType = (mimetype?: string) => (mimetype ?? '').split(';', 1)[0].trim().toLowerCase();

const extensionOf = (name: string) => {
  const base = name.split(/[/\\]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0) {
    return '';
  }
  return base.slice(dot + 1).toLowerCase();
};

const matchesExtension = (name: string, extensions: Set<string>) =>
  extensions.has(extensionOf(name));

const isSvg = (storedFilename: string, originalFilename: string, mime: string) =>
  SVG_MIME_TYPES.has(mime) ||
  matchesExtension(storedFilename, SVG_EXTENSIONS) ||
  matchesExtension(originalFilename, SVG_EXTENSIONS);

const isActiveContent = (storedFilename: string, originalFilename: string, mime: string) =>
  ACTIVE_MIME_TYPES.has(mime) ||
  matchesExtension(storedFilename, ACTIVE_EXTENSIONS) ||
  matchesExtension(originalFilename, ACTIVE_EXTENSIONS);

const fileDownloadHeaders = ({
  storedFilename,
  originalFilename,
  mimetype,
  download,
}: FileDownloadHeaderInput): FileDownloadHeaders => {
  const mime = mediaType(mimetype);
  const active = isActiveContent(storedFilename, originalFilename, mime);
  const disposition = download || active ? 'attachment' : 'inline';
  const filename = encodeURIComponent(originalFilename || storedFilename);

  return {
    contentDisposition: `${disposition}; filename*=UTF-8''${filename}`,
    contentType:
      active && !isSvg(storedFilename, originalFilename, mime)
        ? 'application/octet-stream'
        : mimetype || 'application/octet-stream',
    contentSecurityPolicy: active ? ACTIVE_CONTENT_CSP : undefined,
  };
};

export { fileDownloadHeaders };
export type { FileDownloadHeaderInput, FileDownloadHeaders };
