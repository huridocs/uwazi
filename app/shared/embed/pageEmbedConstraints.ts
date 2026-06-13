const ENTITY_VIEW_EMBED_ERROR = 'Entity view pages cannot be embedded.';

const FORBIDDEN_PAGE_EMBED_TAGS = ['Map', 'SearchBox', 'EntityInfo'] as const;

const findForbiddenPageEmbedTag = (content: string): string | undefined =>
  FORBIDDEN_PAGE_EMBED_TAGS.find(tag => new RegExp(`<${tag}(\\s|>|/)`, 'i').test(content));

export { ENTITY_VIEW_EMBED_ERROR, FORBIDDEN_PAGE_EMBED_TAGS, findForbiddenPageEmbedTag };
