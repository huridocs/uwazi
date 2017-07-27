import franc from 'franc';

let languages = {
  ara: {elastic: 'arabic', ISO639_1: 'ar'},
  arm: {elastic: 'armenian', ISO639_1: 'hy'},
  baq: {elastic: 'basque', ISO639_1: 'eu'},
  bul: {elastic: 'bulgarian', ISO639_1: 'bg'},
  cat: {elastic: 'catalan', ISO639_1: 'ca'},
  cjk: {elastic: 'cjk', ISO639_1: null},
  ces: {elastic: 'czech', ISO639_1: 'cs'},
  dan: {elastic: 'danish', ISO639_1: 'da'},
  nld: {elastic: 'dutch', ISO639_1: 'nl'},
  eng: {elastic: 'english', ISO639_1: 'en'},
  fin: {elastic: 'finnish', ISO639_1: 'fi'},
  fra: {elastic: 'french', ISO639_1: 'fr'},
  glg: {elastic: 'galician', ISO639_1: 'gl'},
  deu: {elastic: 'german', ISO639_1: 'de'},
  ell: {elastic: 'greek', ISO639_1: 'el'},
  hin: {elastic: 'hindi', ISO639_1: 'hi'},
  hun: {elastic: 'hungarian', ISO639_1: 'hu'},
  ind: {elastic: 'indonesian', ISO639_1: 'id'},
  gle: {elastic: 'irish', ISO639_1: 'ga'},
  ita: {elastic: 'italian', ISO639_1: 'it'},
  lav: {elastic: 'latvian', ISO639_1: 'lv'},
  lit: {elastic: 'lithuanian', ISO639_1: 'lt'},
  nob: {elastic: 'norwegian', ISO639_1: 'nb'},
  nno: {elastic: 'norwegian', ISO639_1: 'nn'},
  fas: {elastic: 'persian', ISO639_1: 'fa'},
  por: {elastic: 'portuguese', ISO639_1: 'pt'},
  ron: {elastic: 'romanian', ISO639_1: 'ro'},
  rus: {elastic: 'russian', ISO639_1: 'ru'},
  ckb: {elastic: 'sorani', ISO639_1: null},
  spa: {elastic: 'spanish', ISO639_1: 'es'},
  swe: {elastic: 'swedish', ISO639_1: 'sv'},
  tur: {elastic: 'turkish', ISO639_1: 'tr'},
  tha: {elastic: 'thai', ISO639_1: 'th'}
};

export default {
  getAll: (purpose = 'elastic') => {
    const unique = (v, i, a) => a.indexOf(v) === i;
    const notNull = (v) => Boolean(v);
    return Object.keys(languages)
           .map((k) => languages[k][purpose])
           .filter(unique)
           .filter(notNull);
  },

  detect: (text, purpose = 'elastic') => {
    return languages[franc(text)] ? languages[franc(text)][purpose] : 'other';
  }
};
