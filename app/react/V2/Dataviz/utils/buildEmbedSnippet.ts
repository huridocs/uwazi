const DEFAULT_PAGE_EMBED_HEIGHT = 320;

export const buildPageEmbedSnippet = (id: string): string =>
  `<Dataviz id="${id}" height="${DEFAULT_PAGE_EMBED_HEIGHT}"/>`;

export const buildEmbedSnippet = buildPageEmbedSnippet;

export const buildExternalDatavizEmbedUrl = (
  origin: string,
  id: string,
  locale?: string
): string => {
  const base = `${origin.replace(/\/$/, '')}/embed/dataviz/${id}`;
  return locale ? `${base}?locale=${locale}` : base;
};

export const buildExternalDatavizIframeSnippet = (url: string, height = 400): string =>
  `<iframe src="${url}" width="100%" height="${height}" frameborder="0" loading="lazy"></iframe>`;
