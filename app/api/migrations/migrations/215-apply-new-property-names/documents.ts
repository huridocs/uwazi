import { Pair } from './plans.js';
import { rewriteText } from './textRewrite.js';

type Draft = { content?: string; script?: string; css?: string };

type Link = { url?: string; sublinks?: Link[]; [key: string]: unknown };

const rewriteString = (value: unknown, pairs: Pair[]): unknown => {
  if (typeof value !== 'string') return value;
  return rewriteText(value, pairs);
};

const rewriteDraft = (draft: Draft | undefined, pairs: Pair[]): Draft | undefined => {
  if (!draft) return draft;
  return {
    ...draft,
    content: rewriteString(draft.content, pairs) as string | undefined,
    script: rewriteString(draft.script, pairs) as string | undefined,
  };
};

const rewriteLinks = (links: Link[] | undefined, pairs: Pair[]): Link[] | undefined => {
  if (!links) return links;
  return links.map(link => ({
    ...link,
    url: rewriteString(link.url, pairs) as string | undefined,
    sublinks: rewriteLinks(link.sublinks, pairs),
  }));
};

const rewriteLocales = (
  locales: Record<string, { draft?: Draft } | undefined> | undefined,
  pairs: Pair[]
) => {
  if (!locales) return locales;
  return Object.fromEntries(
    Object.entries(locales).map(([language, locale]) => [
      language,
      locale ? { ...locale, draft: rewriteDraft(locale.draft, pairs) } : locale,
    ])
  );
};

const RELEASE_FIXED = new Set(['_id', 'page', 'version', 'release_message', 'user', 'date']);

const rewriteReleaseLocale = (locale: Record<string, unknown>, pairs: Pair[]) => ({
  ...locale,
  content: rewriteString(locale.content, pairs),
  script: rewriteString(locale.script, pairs),
});

const rewriteRelease = (doc: Record<string, unknown>, pairs: Pair[]): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(doc).map(([key, value]) => {
      if (RELEASE_FIXED.has(key) || !value || typeof value !== 'object') {
        return [key, value];
      }
      return [key, rewriteReleaseLocale(value as Record<string, unknown>, pairs)];
    })
  );

const pageUpdate = (
  page: { locales?: Record<string, { draft?: Draft }>; draft?: Draft; metadata?: Draft },
  pairs: Pair[]
) => {
  const $set: Record<string, unknown> = {};
  if (page.locales) $set.locales = rewriteLocales(page.locales, pairs);
  if (page.draft) $set.draft = rewriteDraft(page.draft, pairs);
  if (page.metadata) $set.metadata = rewriteDraft(page.metadata, pairs);
  return $set;
};

const settingsTextUpdate = (settings: { links?: Link[]; home_page?: unknown }, pairs: Pair[]) => {
  const $set: Record<string, unknown> = {};
  if (Array.isArray(settings.links)) $set.links = rewriteLinks(settings.links, pairs);
  if (typeof settings.home_page === 'string') {
    $set.home_page = rewriteText(settings.home_page, pairs);
  }
  return $set;
};

export type { Draft, Link };
export { pageUpdate, rewriteRelease, settingsTextUpdate };
