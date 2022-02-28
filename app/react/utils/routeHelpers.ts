export function validateHomePageRoute(route: string) {
  const queryParams = '(\\?.*)?)';
  const languageMatch = '(/[a-zA-Z]{2,3})?';
  const library = `(library(/map)?(/table)?/?${queryParams}`;
  const entity = '(entity/.+)';
  const page = '(page/.+)';
  const matcher = new RegExp(`${languageMatch}/(${library}|${page}|${entity})$`);
  return route.match(matcher) !== null;
}
