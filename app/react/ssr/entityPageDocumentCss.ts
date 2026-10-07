const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const cssFromLoaderValue = (value: unknown): string | undefined => {
  if (!isRecord(value) || !isRecord(value.entityPageView)) return undefined;
  const { pageView } = value.entityPageView;
  if (!isRecord(pageView) || !isRecord(pageView.metadata)) return undefined;
  const { css } = pageView.metadata;
  return typeof css === 'string' && css.trim() ? css : undefined;
};

const entityPageDocumentCss = (loaderData: object | undefined): string | undefined => {
  if (!loaderData) return undefined;
  for (const value of Object.values(loaderData)) {
    const css = cssFromLoaderValue(value);
    if (css) return css;
  }
  return undefined;
};

export { entityPageDocumentCss };
