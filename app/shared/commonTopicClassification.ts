/** @format */

export function convertThesaurusName(thesaurusName: string) {
  return `${thesaurusName.toLowerCase().replace(/[^0-9a-z]/g, '')}`;
}

/* Convert Uwazi concepts into their Topic Classification model equivalent. */
export function buildFullModelName(thesaurusName: string) {
  return `${process.env.DATABASE_NAME}-${convertThesaurusName(thesaurusName)}`;
}
