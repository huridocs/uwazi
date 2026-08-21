function stripPageParam(search: string): string {
  if (!search.match(/page=/)) {
    return search;
  }
  const cleanSearch = search.split(/page=\d+|&page=\d+/).join('');
  return cleanSearch === '?' ? '' : cleanSearch;
}

function buildLanguageSwitchUrl(input: {
  pathname: string;
  search: string;
  hash: string;
  languageKey: string;
}): string {
  // Remove existing language prefix if present
  const pathWithoutLanguage = input.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  // Add new language prefix
  const newPath = `/${input.languageKey}${pathWithoutLanguage === '/' ? '' : pathWithoutLanguage}`;
  // Preserve search parameters except for document page parameter
  const search = pathWithoutLanguage.match('document') ? '' : stripPageParam(input.search);
  return `${newPath}${search}${input.hash}`;
}

export { buildLanguageSwitchUrl };
