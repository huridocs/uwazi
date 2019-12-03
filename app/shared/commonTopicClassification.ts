/** @format */
export function buildModelName(thesaurusName: string) {
  return `${process.env.DATABASE_NAME}-${thesaurusName.toLowerCase().replace(/ /g, '_')}`;
}
