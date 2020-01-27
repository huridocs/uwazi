/** @format */

export function buildModelName(thesaurusName: string) {
  return `${process.env.DATABASE_NAME}-${thesaurusName.toLowerCase().replace(/[^0-9a-z]/g, '')}`;
}
