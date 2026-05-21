const getPageUrlWithSharedId = (sharedId: string, slug: string) => `page/${sharedId}/${slug}`;

const getPageUrlSlugOnly = (slug: string) => `page/${slug}`;

const getPageDraftUrl = (sharedId: string, slug: string) => `page-draft/${sharedId}/${slug}`;

export { getPageUrlWithSharedId, getPageUrlSlugOnly, getPageDraftUrl };
