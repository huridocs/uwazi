
let languages = {
  ara: {franc: 'ara', elastic: 'arabic', ISO639_1: 'ar'},
  bul: {franc: 'bul', elastic: 'bulgarian', ISO639_1: 'bg'},
  cat: {franc: 'cat', elastic: 'catalan', ISO639_1: 'ca'},
  cjk: {franc: 'cjk', elastic: 'cjk', ISO639_1: null},
  ckb: {franc: 'ckb', elastic: 'sorani', ISO639_1: null},
  ces: {franc: 'ces', elastic: 'czech', ISO639_1: 'cs'},
  dan: {franc: 'dan', elastic: 'danish', ISO639_1: 'da'},
  deu: {franc: 'deu', elastic: 'german', ISO639_1: 'de'},
  ell: {franc: 'ell', elastic: 'greek', ISO639_1: 'el'},
  eng: {franc: 'eng', elastic: 'english', ISO639_1: 'en'},
  eus: {franc: 'eus', elastic: 'basque', ISO639_1: 'eu'},
  fas: {franc: 'fas', elastic: 'persian', ISO639_1: 'fa'},
  fin: {franc: 'fin', elastic: 'finnish', ISO639_1: 'fi'},
  fra: {franc: 'fra', elastic: 'french', ISO639_1: 'fr'},
  gle: {franc: 'gle', elastic: 'irish', ISO639_1: 'ga'},
  glg: {franc: 'glg', elastic: 'galician', ISO639_1: 'gl'},
  hin: {franc: 'hin', elastic: 'hindi', ISO639_1: 'hi'},
  hun: {franc: 'hun', elastic: 'hungarian', ISO639_1: 'hu'},
  hye: {franc: 'hye', elastic: 'armenian', ISO639_1: 'hy'},
  ind: {franc: 'ind', elastic: 'indonesian', ISO639_1: 'id'},
  ita: {franc: 'ita', elastic: 'italian', ISO639_1: 'it'},
  lav: {franc: 'lav', elastic: 'latvian', ISO639_1: 'lv'},
  lit: {franc: 'lit', elastic: 'lithuanian', ISO639_1: 'lt'},
  nld: {franc: 'nld', elastic: 'dutch', ISO639_1: 'nl'},
  nno: {franc: 'nno', elastic: 'norwegian', ISO639_1: 'nn'},
  nob: {franc: 'nob', elastic: 'norwegian', ISO639_1: 'nb'},
  por: {franc: 'por', elastic: 'portuguese', ISO639_1: 'pt'},
  ron: {franc: 'ron', elastic: 'romanian', ISO639_1: 'ro'},
  rus: {franc: 'rus', elastic: 'russian', ISO639_1: 'ru'},
  spa: {franc: 'spa', elastic: 'spanish', ISO639_1: 'es'},
  swe: {franc: 'swe', elastic: 'swedish', ISO639_1: 'sv'},
  tha: {franc: 'tha', elastic: 'thai', ISO639_1: 'th'},
  tur: {franc: 'tur', elastic: 'turkish', ISO639_1: 'tr'}
};

export default (key, purpose = 'elastic') => {
  return languages[key] ? languages[key][purpose] : null;
};

export {languages};
