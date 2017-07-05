import franc from 'franc';

let languages = {
  ara: 'arabic',
  arm: 'armenian',
  baq: 'basque',
  bul: 'bulgarian',
  cat: 'catalan',
  cjk: 'cjk',
  ces: 'czech',
  dan: 'danish',
  nld: 'dutch',
  eng: 'english',
  fin: 'finnish',
  fra: 'french',
  glg: 'galician',
  deu: 'german',
  ell: 'greek',
  hin: 'hindi',
  hun: 'hungarian',
  ind: 'indonesian',
  gle: 'irish',
  ita: 'italian',
  lav: 'latvian',
  lit: 'lithuanian',
  nob: 'norwegian',
  nno: 'norwegian',
  fas: 'persian',
  por: 'portuguese',
  ron: 'romanian',
  rus: 'russian',
  ckb: 'sorani',
  spa: 'spanish',
  swe: 'swedish',
  tur: 'turkish',
  tha: 'thai'
};

export default {
  get: () => {
    const unique = (v, i, a) => a.indexOf(v) === i;
    return Object.keys(languages).map((k) => languages[k]).filter(unique);
  },

  detect: (text) => {
    return languages[franc(text)] || 'other';
  }
};
