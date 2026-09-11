import type { ClientSettings } from '#app/apiResponseTypes.js';

type SeoMetaTag = {
  charSet?: string;
  name?: string;
  property?: string;
  content?: string;
};

type InstanceSeoMeta = {
  defaultTitle: string;
  titleTemplate: string;
  meta: SeoMetaTag[];
};

const DEFAULT_SITE_NAME = 'Uwazi';

const toAbsoluteUrl = (url: string, origin: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }
  if (!origin) {
    return url;
  }
  try {
    return new URL(url, origin.endsWith('/') ? origin : `${origin}/`).href;
  } catch {
    return url;
  }
};

const getInstanceSeoMeta = (
  settings: Pick<ClientSettings, 'site_name' | 'seo'>,
  origin = ''
): InstanceSeoMeta => {
  const siteName = settings.site_name?.trim() || DEFAULT_SITE_NAME;
  const title = settings.seo?.title?.trim() || siteName;
  const description = settings.seo?.description?.trim() || '';
  const ogTitle = settings.seo?.ogTitle?.trim() || title;
  const ogDescription = settings.seo?.ogDescription?.trim() || description;
  const ogImage = settings.seo?.ogImage?.trim()
    ? toAbsoluteUrl(settings.seo.ogImage.trim(), origin)
    : undefined;

  const meta: SeoMetaTag[] = [
    { charSet: 'utf-8' },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: ogTitle },
    ...(description ? [{ name: 'description', content: description }] : []),
    ...(ogDescription ? [{ property: 'og:description', content: ogDescription }] : []),
    ...(ogImage ? [{ property: 'og:image', content: ogImage }] : []),
  ];

  return {
    defaultTitle: title,
    titleTemplate: `%s • ${siteName}`,
    meta,
  };
};

export { getInstanceSeoMeta };
export type { InstanceSeoMeta, SeoMetaTag };
