/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface EntityInputData {
  _id: string;
  sharedId: string;
  language:
    | 'ab'
    | 'aa'
    | 'af'
    | 'ak'
    | 'sq'
    | 'am'
    | 'ar'
    | 'an'
    | 'hy'
    | 'as'
    | 'av'
    | 'ae'
    | 'ay'
    | 'az'
    | 'bm'
    | 'ba'
    | 'eu'
    | 'be'
    | 'bn'
    | 'bh'
    | 'bi'
    | 'bs'
    | 'br'
    | 'bg'
    | 'my'
    | 'ca'
    | 'ch'
    | 'ce'
    | 'ny'
    | 'zh'
    | 'zh-Hans'
    | 'zh-Hant'
    | 'cv'
    | 'kw'
    | 'co'
    | 'cr'
    | 'hr'
    | 'cs'
    | 'da'
    | 'dv'
    | 'nl'
    | 'dz'
    | 'en'
    | 'eo'
    | 'et'
    | 'ee'
    | 'fo'
    | 'fj'
    | 'fi'
    | 'fr'
    | 'ff'
    | 'gl'
    | 'gd'
    | 'gv'
    | 'ka'
    | 'de'
    | 'el'
    | 'gn'
    | 'gu'
    | 'ht'
    | 'ha'
    | 'he'
    | 'hz'
    | 'hi'
    | 'ho'
    | 'hu'
    | 'is'
    | 'io'
    | 'ig'
    | 'in'
    | 'ia'
    | 'ie'
    | 'iu'
    | 'ik'
    | 'ga'
    | 'it'
    | 'ja'
    | 'jv'
    | 'kl'
    | 'kn'
    | 'kr'
    | 'ks'
    | 'kk'
    | 'km'
    | 'ki'
    | 'rw'
    | 'rn'
    | 'ky'
    | 'kv'
    | 'kg'
    | 'ko'
    | 'ku'
    | 'kj'
    | 'lo'
    | 'la'
    | 'lv'
    | 'li'
    | 'ln'
    | 'lt'
    | 'lu'
    | 'lg'
    | 'lb'
    | 'mk'
    | 'mg'
    | 'ms'
    | 'ml'
    | 'mt'
    | 'mi'
    | 'mr'
    | 'mh'
    | 'mn'
    | 'na'
    | 'nv'
    | 'ng'
    | 'nd'
    | 'ne'
    | 'no'
    | 'nb'
    | 'nn'
    | 'oc'
    | 'oj'
    | 'cu'
    | 'or'
    | 'om'
    | 'os'
    | 'pi'
    | 'ps'
    | 'fa'
    | 'pl'
    | 'pt'
    | 'pa'
    | 'qu'
    | 'rm'
    | 'ro'
    | 'ru'
    | 'se'
    | 'sm'
    | 'sg'
    | 'sa'
    | 'sr'
    | 'sh'
    | 'st'
    | 'tn'
    | 'sn'
    | 'ii'
    | 'sd'
    | 'si'
    | 'ss'
    | 'sk'
    | 'sl'
    | 'so'
    | 'nr'
    | 'es'
    | 'su'
    | 'sw'
    | 'sv'
    | 'tl'
    | 'ty'
    | 'tg'
    | 'ta'
    | 'tt'
    | 'te'
    | 'th'
    | 'bo'
    | 'ti'
    | 'to'
    | 'ts'
    | 'tr'
    | 'tk'
    | 'tw'
    | 'ug'
    | 'uk'
    | 'ur'
    | 'uz'
    | 've'
    | 'vi'
    | 'vo'
    | 'wa'
    | 'cy'
    | 'wo'
    | 'fy'
    | 'xh'
    | 'yi'
    | 'yo'
    | 'za'
    | 'zu';
  title: string;
  template: string;
  metadata: {
    [k: string]:
      | {
          value:
            | null
            | string
            | number
            | boolean
            | {
                label: string | null;
                url: string | null;
              }
            | {
                from: number | null;
                to: number | null;
              }
            | {
                label?: string;
                lat: number;
                lon: number;
              }
            | {
                label?: string;
                lat: number;
                lon: number;
              }[];
          [k: string]: unknown | undefined;
        }[]
      | undefined;
  };
  [k: string]: unknown | undefined;
}