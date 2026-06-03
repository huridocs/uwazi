import _ from 'lodash';

/** Display-only slug derived from locale title (not stored or used for lookup). */
const pageSlugFromTitle = (title: string) => _.kebabCase((title ?? '').trim()) || 'page';

const getPageUrl = (sharedId: string, title: string) =>
  `page/${sharedId}/${pageSlugFromTitle(title)}`;

const getPageDraftUrl = (sharedId: string, title: string) =>
  `page-draft/${sharedId}/${pageSlugFromTitle(title)}`;

export { pageSlugFromTitle, getPageUrl, getPageDraftUrl };
