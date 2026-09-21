#!/usr/bin/env node
/**
 * Kitchen dataset seed for a running Uwazi instance.
 * Talks only to the HTTP API (default http://localhost:3000).
 *
 *   yarn seed-kitchen            # create kitchen, or enrich Spanish + page if it already exists
 *   yarn seed-kitchen:reset      # wipe kitchen templates and rebuild including Spanish + Cookbook page
 *   UWAZI_URL=http://localhost:3000 UWAZI_USER=admin UWAZI_PASSWORD=admin yarn seed-kitchen
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { File } from 'node:buffer';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CACHE = join(ROOT, 'cache');
const BASE = (process.env.UWAZI_URL || 'http://localhost:3000').replace(/\/$/, '');
const USER = process.env.UWAZI_USER || 'admin';
const PASSWORD = process.env.UWAZI_PASSWORD || 'admin';
const WIKI_UA =
  'UwaziKitchenFixtures/1.0 (https://www.uwazi.io/; local development fixture seed) Node.js';
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const WIKI_DELAY_MS = 350;
const KITCHEN_TEMPLATE_NAMES = ['Ingredient', 'Chef', 'Restaurant', 'Recipe'];

mkdirSync(join(CACHE, 'summary'), { recursive: true });
mkdirSync(join(CACHE, 'summary-es'), { recursive: true });
mkdirSync(join(CACHE, 'pdf'), { recursive: true });
mkdirSync(join(CACHE, 'pdf-es'), { recursive: true });
mkdirSync(join(CACHE, 'img'), { recursive: true });
mkdirSync(join(CACHE, 'media'), { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const unix = iso => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 1000);

const wikiSlug = title => title.replace(/\s+/g, '_');

const wikiHost = lang => (lang === 'es' ? 'es.wikipedia.org' : 'en.wikipedia.org');

const wikiUrl = (title, lang = 'en') => `https://${wikiHost(lang)}/wiki/${wikiSlug(title)}`;

const idOf = doc => {
  if (!doc) return '';
  const raw = doc._id ?? doc.id;
  if (raw && typeof raw === 'object' && raw.$oid) return String(raw.$oid);
  return raw != null ? String(raw) : '';
};

const asList = body => {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.rows)) return body.rows;
  return [body];
};

const flattenThesaurus = (values, acc = {}) => {
  for (const value of values || []) {
    acc[value.label] = value.id;
    if (value.values) flattenThesaurus(value.values, acc);
  }
  return acc;
};

const propByLabel = (template, label) =>
  (template.properties || []).find(property => property.label === label);

const propName = (template, label) => propByLabel(template, label)?.name;

const val = value => [{ value }];

const vals = values => values.map(value => ({ value }));

let lastWikiAt = 0;
let cookieHeader = '';
let pdfBrowser;

const log = (...args) => console.log('[kitchen]', ...args);

async function wikiFetch(url, { accept } = {}) {
  const wait = WIKI_DELAY_MS - (Date.now() - lastWikiAt);
  if (wait > 0) await sleep(wait);
  lastWikiAt = Date.now();
  const response = await fetch(url, {
    headers: { 'User-Agent': WIKI_UA, Accept: accept || '*/*' },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Wikipedia ${response.status} ${url}`);
  }
  return response;
}

async function loadSummary(title, lang = 'en') {
  const dir = lang === 'es' ? 'summary-es' : 'summary';
  const path = join(CACHE, dir, `${wikiSlug(title)}.json`);
  if (existsSync(path)) return JSON.parse(readFileSync(path, 'utf8'));
  const encoded = encodeURIComponent(wikiSlug(title));
  const response = await wikiFetch(
    `https://${wikiHost(lang)}/api/rest_v1/page/summary/${encoded}`,
    { accept: 'application/json' }
  );
  const json = await response.json();
  writeFileSync(path, JSON.stringify(json, null, 2));
  return json;
}

async function htmlToPdf(title, lang = 'en') {
  const encoded = encodeURIComponent(wikiSlug(title));
  const htmlRes = await wikiFetch(
    `https://${wikiHost(lang)}/api/rest_v1/page/html/${encoded}`,
    { accept: 'text/html' }
  );
  const article = await htmlRes.text();
  const { chromium } = await import('playwright');
  if (!pdfBrowser) pdfBrowser = await chromium.launch({ headless: true });
  const page = await pdfBrowser.newPage();
  try {
    await page.setContent(
      `<!doctype html><html><head><base href="https://${wikiHost(lang)}/">
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 16px auto; padding: 0 16px; color: #1c1712; }
        img, video { max-width: 100%; height: auto; }
        table { font-size: 12px; border-collapse: collapse; }
        .mw-ref, .noprint, [role="note"] { display: none; }
      </style></head><body>${article}</body></html>`,
      { waitUntil: 'networkidle', timeout: 90_000 }
    );
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

async function loadPdf(title, lang = 'en') {
  const dir = lang === 'es' ? 'pdf-es' : 'pdf';
  const path = join(CACHE, dir, `${wikiSlug(title)}.pdf`);
  if (existsSync(path) && readFileSync(path).length > 1000) return readFileSync(path);

  const encoded = encodeURIComponent(wikiSlug(title));
  let buffer;
  try {
    const response = await wikiFetch(
      `https://${wikiHost(lang)}/api/rest_v1/page/pdf/${encoded}`
    );
    buffer = Buffer.from(await response.arrayBuffer());
    const type = response.headers.get('content-type') || '';
    if (!type.includes('pdf') || buffer.length > MAX_PDF_BYTES || buffer.slice(0, 4).toString() !== '%PDF') {
      log(`PDF export unusable for ${title} (${lang}, ${type}, ${buffer.length} bytes); converting HTML`);
      buffer = await htmlToPdf(title, lang);
    }
  } catch (error) {
    log(`PDF export failed for ${title} (${lang}): ${error.message}; converting HTML`);
    buffer = await htmlToPdf(title, lang);
  }

  writeFileSync(path, buffer);
  return buffer;
}

async function loadImage(title, summary) {
  const path = join(CACHE, 'img', `${wikiSlug(title)}.jpg`);
  if (existsSync(path) && readFileSync(path).length > 100) return readFileSync(path);
  const source = summary?.originalimage?.source || summary?.thumbnail?.source;
  if (!source) return null;
  const response = await wikiFetch(source);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(path, buffer);
  return buffer;
}

function makeWav() {
  const path = join(CACHE, 'media', 'kitchen-note.wav');
  if (existsSync(path)) return readFileSync(path);
  execFileSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', 'sine=f=440:d=2', '-ar', '22050', '-ac', '1', path],
    { stdio: 'ignore' }
  );
  return readFileSync(path);
}

function makeMp4() {
  const path = join(CACHE, 'media', 'kitchen-demo.mp4');
  if (existsSync(path)) return readFileSync(path);
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'color=c=0x785900:s=320x180:d=2',
      '-f',
      'lavfi',
      '-i',
      'sine=f=440:d=2',
      '-shortest',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:v',
      'libx264',
      '-c:a',
      'aac',
      path,
    ],
    { stdio: 'ignore' }
  );
  return readFileSync(path);
}

function parseSetCookie(headerValue) {
  if (!headerValue) return '';
  return headerValue.split(';')[0];
}

function storeCookies(response) {
  const chunks =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean);
  const parts = chunks.map(parseSetCookie).filter(Boolean);
  if (!parts.length) return;
  const byName = new Map(
    (cookieHeader ? cookieHeader.split('; ') : [])
      .concat(parts)
      .map(part => [part.split('=')[0], part])
  );
  cookieHeader = [...byName.values()].join('; ');
}

async function raw(method, path, { json, form, headers } = {}) {
  const options = {
    method,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept-Language': 'en',
      Cookie: cookieHeader,
      ...headers,
    },
    redirect: 'manual',
  };
  if (json !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  }
  if (form) {
    options.body = form;
  }
  const response = await fetch(`${BASE}${path}`, options);
  storeCookies(response);
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    throw new Error(`${method} ${path} redirected ${response.status} → ${location}`);
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status} ${text.slice(0, 800)}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const api = (method, path, json) => raw(method, path, { json });

async function upload(kind, entitySharedId, filename, mime, buffer, lang = 'en') {
  const form = new FormData();
  form.append('entity', entitySharedId);
  form.append('originalname', filename);
  form.append('file', new File([new Uint8Array(buffer)], filename, { type: mime }));
  const uploaded = await raw('POST', `/api/files/upload/${kind}`, {
    form,
    headers: { 'Accept-Language': lang },
  });
  if (!uploaded?.filename || !uploaded.size) {
    throw new Error(`Upload of ${filename} returned no file (${JSON.stringify(uploaded).slice(0, 200)})`);
  }
  log(`uploaded ${filename} → ${uploaded.filename} (${uploaded.size} bytes, ${uploaded.status || uploaded.type})`);
  return uploaded;
}

async function login() {
  log(`login ${USER} @ ${BASE}`);
  await api('POST', '/api/login', { username: USER, password: PASSWORD });
  if (!cookieHeader) throw new Error('Login succeeded but no session cookie was set');
}

function pickSnippet(extract, needles) {
  const text = (extract || '').replace(/\s+/g, ' ').trim();
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  for (const needle of needles) {
    if (!needle) continue;
    const hit = sentences.find(sentence =>
      sentence.toLowerCase().includes(String(needle).toLowerCase())
    );
    if (hit) return hit.slice(0, 280);
  }
  return (sentences[0] || text).slice(0, 280);
}

const CUISINE = {
  name: 'Cuisine',
  values: [
    {
      label: 'Europe',
      values: [
        { label: 'Spanish' },
        { label: 'French' },
        { label: 'Italian' },
        { label: 'Portuguese' },
      ],
    },
    {
      label: 'Asia',
      values: [
        { label: 'Japanese' },
        { label: 'Vietnamese' },
        { label: 'Thai' },
        { label: 'Chinese' },
      ],
    },
    {
      label: 'Americas',
      values: [{ label: 'Peruvian' }, { label: 'Mexican' }, { label: 'Brazilian' }],
    },
    {
      label: 'Middle East & Africa',
      values: [{ label: 'Israeli' }, { label: 'North African' }],
    },
  ],
};

const DIET = {
  name: 'Diet',
  values: [
    { label: 'Omnivore' },
    { label: 'Vegetarian' },
    { label: 'Vegan' },
    { label: 'Gluten-free' },
  ],
};

const SEASON = {
  name: 'Season',
  values: [{ label: 'Spring' }, { label: 'Summer' }, { label: 'Autumn' }, { label: 'Winter' }],
};

const COURSE = {
  name: 'Course',
  values: [{ label: 'Starter' }, { label: 'Soup' }, { label: 'Main' }, { label: 'Dessert' }],
};

const NATIONALITY = {
  name: 'Nationality',
  values: [
    { label: 'American' },
    { label: 'Spanish' },
    { label: 'Italian' },
    { label: 'French' },
    { label: 'Japanese' },
    { label: 'Peruvian' },
    { label: 'British' },
    { label: 'Mexican' },
  ],
};

const TITLE_ES = {
  Tomato: 'Tomate',
  'Olive oil': 'Aceite de oliva',
  Garlic: 'Ajo',
  Saffron: 'Azafrán',
  'Coconut milk': 'Leche de coco',
  Rice: 'Arroz',
  Eggplant: 'Berenjena',
  Basil: 'Albahaca',
  'Fish sauce': 'Salsa de pescado',
  Lime: 'Lima',
  Pork: 'Cerdo',
  Egg: 'Huevo',
  Coffee: 'Café',
  Mascarpone: 'Mascarpone',
  Miso: 'Miso',
  Onion: 'Cebolla',
  'Julia Child': 'Julia Child',
  'Ferran Adrià': 'Ferran Adrià',
  'Alice Waters': 'Alice Waters',
  'Massimo Bottura': 'Massimo Bottura',
  'Nobu Matsuhisa': 'Nobu Matsuhisa',
  'Gastón Acurio': 'Gastón Acurio',
  'Elena Arzak': 'Elena Arzak',
  'Yotam Ottolenghi': 'Yotam Ottolenghi',
  elBulli: 'elBulli',
  'Osteria Francescana': 'Osteria Francescana',
  'Chez Panisse': 'Chez Panisse',
  Matsuhisa: 'Matsuhisa',
  'Astrid y Gastón': 'Astrid y Gastón',
  Arzak: 'Arzak',
  'El Bulli': 'El Bulli',
  'Nobu (restaurant)': 'Nobu',
  'Astrid & Gaston': 'Astrid y Gastón',
  Paella: 'Paella',
  Ratatouille: 'Ratatouille',
  Pho: 'Pho',
  Ceviche: 'Ceviche',
  Tiramisu: 'Tiramisú',
  Sushi: 'Sushi',
  Gazpacho: 'Gazpacho',
  Shakshuka: 'Shakshuka',
  'Pad Thai': 'Pad Thai',
  Feijoada: 'Feijoada',
  'Miso soup': 'Sopa de miso',
  Cassoulet: 'Cassoulet',
};

const WIKI_ES = {
  Tomato: 'Tomate',
  'Olive oil': 'Aceite de oliva',
  Garlic: 'Ajo',
  Saffron: 'Azafrán',
  'Coconut milk': 'Leche de coco',
  Rice: 'Arroz',
  Eggplant: 'Berenjena',
  Basil: 'Albahaca',
  'Fish sauce': 'Salsa de pescado',
  'Lime (fruit)': 'Lima (fruto)',
  Pork: 'Carne de cerdo',
  'Egg as food': 'Huevo (alimento)',
  Coffee: 'Café',
  Mascarpone: 'Mascarpone',
  Miso: 'Miso',
  Onion: 'Cebolla',
  'Julia Child': 'Julia Child',
  'Ferran Adrià': 'Ferran Adrià',
  'Alice Waters': 'Alice Waters',
  'Massimo Bottura': 'Massimo Bottura',
  'Nobu Matsuhisa': 'Nobu Matsuhisa',
  'Gastón Acurio': 'Gastón Acurio',
  'Elena Arzak': 'Elena Arzak',
  'Yotam Ottolenghi': 'Yotam Ottolenghi',
  'El Bulli': 'El Bulli',
  'Osteria Francescana': 'Osteria Francescana',
  'Chez Panisse': 'Chez Panisse',
  'Nobu (restaurant)': 'Nobu',
  'Astrid & Gaston': 'Astrid y Gastón',
  Arzak: 'Arzak',
  Paella: 'Paella',
  Ratatouille: 'Ratatouille',
  Pho: 'Pho',
  Ceviche: 'Ceviche',
  Tiramisu: 'Tiramisú',
  Sushi: 'Sushi',
  Gazpacho: 'Gazpacho',
  Shakshouka: 'Shakshuka',
  'Pad thai': 'Pad thai',
  Feijoada: 'Feijoada',
  'Miso soup': 'Sopa de miso',
  Cassoulet: 'Cassoulet',
};

const I18N_ES = {
  Ingredient: 'Ingrediente',
  Chef: 'Chef',
  Restaurant: 'Restaurante',
  Recipe: 'Receta',
  Description: 'Descripción',
  'Botanical name': 'Nombre botánico',
  'Calories per 100g': 'Calorías por 100g',
  Cuisine: 'Cocina',
  Photo: 'Foto',
  'Catalog ID': 'ID de catálogo',
  Biography: 'Biografía',
  Born: 'Nacimiento',
  Nationality: 'Nacionalidad',
  Studio: 'Estudio',
  Website: 'Sitio web',
  Portrait: 'Retrato',
  'Open period': 'Periodo de apertura',
  Location: 'Ubicación',
  'Head chef': 'Chef principal',
  Method: 'Elaboración',
  Servings: 'Raciones',
  'Published on': 'Publicado',
  'Festival dates': 'Fechas de festival',
  'Development period': 'Periodo de desarrollo',
  'Service windows': 'Ventanas de servicio',
  Diet: 'Dieta',
  Season: 'Temporada',
  Course: 'Plato',
  Ingredients: 'Ingredientes',
  Wikipedia: 'Wikipedia',
  'Plate photo': 'Foto del plato',
  'Document preview': 'Vista previa',
  'Demo video': 'Vídeo demo',
  'Kitchen audio': 'Audio de cocina',
  'Recipe code': 'Código de receta',
  Europe: 'Europa',
  Asia: 'Asia',
  Americas: 'América',
  'Middle East & Africa': 'Oriente Medio y África',
  Spanish: 'Española',
  French: 'Francesa',
  Italian: 'Italiana',
  Portuguese: 'Portuguesa',
  Japanese: 'Japonesa',
  Vietnamese: 'Vietnamita',
  Thai: 'Tailandesa',
  Chinese: 'China',
  Peruvian: 'Peruana',
  Mexican: 'Mexicana',
  Brazilian: 'Brasileña',
  Israeli: 'Israelí',
  'North African': 'Norte de África',
  Omnivore: 'Omnívoro',
  Vegetarian: 'Vegetariana',
  Vegan: 'Vegana',
  'Gluten-free': 'Sin gluten',
  Spring: 'Primavera',
  Summer: 'Verano',
  Autumn: 'Otoño',
  Winter: 'Invierno',
  Starter: 'Entrante',
  Soup: 'Sopa',
  Main: 'Principal',
  Dessert: 'Postre',
  American: 'Estadounidense',
  British: 'Británica',
  'uses ingredient': 'usa ingrediente',
  'created by': 'creado por',
  'served at': 'servido en',
  'cited in': 'citado en',
  Cookbook: 'Recetario',
};

const SPANISH_LANGUAGE = {
  key: 'es',
  label: 'Spanish',
  ISO639_3: 'spa',
  ISO639_1: 'es',
  elastic: 'spanish',
  localized_label: 'Espanol',
  translationAvailable: true,
};

const DATAVIZ_DIET_NAME = 'Recipes by diet';
const DATAVIZ_COURSE_NAME = 'Recipes by course';
const PAGE_TITLE_EN = 'Cookbook';
const PAGE_TITLE_ES = 'Recetario';

const INGREDIENTS = [
  { title: 'Tomato', wiki: 'Tomato', cuisine: 'Spanish', kcal: 18, botanical: 'Solanum lycopersicum', pdf: true },
  { title: 'Olive oil', wiki: 'Olive oil', cuisine: 'Spanish', kcal: 884, botanical: 'Olea europaea', pdf: true },
  { title: 'Garlic', wiki: 'Garlic', cuisine: 'Italian', kcal: 149, botanical: 'Allium sativum', pdf: true },
  { title: 'Saffron', wiki: 'Saffron', cuisine: 'Spanish', kcal: 310, botanical: 'Crocus sativus', pdf: true },
  { title: 'Coconut milk', wiki: 'Coconut milk', cuisine: 'Thai', kcal: 230, botanical: 'Cocos nucifera', pdf: true },
  { title: 'Rice', wiki: 'Rice', cuisine: 'Japanese', kcal: 130, botanical: 'Oryza sativa' },
  { title: 'Eggplant', wiki: 'Eggplant', cuisine: 'French', kcal: 25, botanical: 'Solanum melongena' },
  { title: 'Basil', wiki: 'Basil', cuisine: 'Italian', kcal: 22, botanical: 'Ocimum basilicum' },
  { title: 'Fish sauce', wiki: 'Fish sauce', cuisine: 'Vietnamese', kcal: 35, botanical: '' },
  { title: 'Lime', wiki: 'Lime (fruit)', cuisine: 'Peruvian', kcal: 30, botanical: 'Citrus aurantiifolia' },
  { title: 'Pork', wiki: 'Pork', cuisine: 'Portuguese', kcal: 242, botanical: '' },
  { title: 'Egg', wiki: 'Egg as food', cuisine: 'French', kcal: 155, botanical: '' },
  { title: 'Coffee', wiki: 'Coffee', cuisine: 'Italian', kcal: 2, botanical: 'Coffea' },
  { title: 'Mascarpone', wiki: 'Mascarpone', cuisine: 'Italian', kcal: 429, botanical: '' },
  { title: 'Miso', wiki: 'Miso', cuisine: 'Japanese', kcal: 199, botanical: '' },
  { title: 'Onion', wiki: 'Onion', cuisine: 'French', kcal: 40, botanical: 'Allium cepa' },
];

const CHEFS = [
  {
    title: 'Julia Child',
    wiki: 'Julia Child',
    born: '1912-08-15',
    nationality: 'American',
    geo: [42.3736, -71.1097, 'Cambridge, MA'],
    site: 'https://en.wikipedia.org/wiki/Julia_Child',
    pdf: true,
  },
  {
    title: 'Ferran Adrià',
    wiki: 'Ferran Adrià',
    born: '1962-05-14',
    nationality: 'Spanish',
    geo: [42.263, 3.175, 'Roses, Spain'],
    site: 'https://en.wikipedia.org/wiki/Ferran_Adri%C3%A0',
    pdf: true,
  },
  {
    title: 'Alice Waters',
    wiki: 'Alice Waters',
    born: '1944-04-28',
    nationality: 'American',
    geo: [37.8715, -122.273, 'Berkeley, CA'],
    site: 'https://en.wikipedia.org/wiki/Alice_Waters',
    pdf: true,
  },
  {
    title: 'Massimo Bottura',
    wiki: 'Massimo Bottura',
    born: '1962-09-30',
    nationality: 'Italian',
    geo: [44.6471, 10.9252, 'Modena'],
    site: 'https://en.wikipedia.org/wiki/Massimo_Bottura',
    pdf: true,
  },
  {
    title: 'Nobu Matsuhisa',
    wiki: 'Nobu Matsuhisa',
    born: '1949-03-31',
    nationality: 'Japanese',
    geo: [34.0522, -118.2437, 'Los Angeles'],
    site: 'https://en.wikipedia.org/wiki/Nobu_Matsuhisa',
  },
  {
    title: 'Gastón Acurio',
    wiki: 'Gastón Acurio',
    born: '1967-10-30',
    nationality: 'Peruvian',
    geo: [-12.0464, -77.0428, 'Lima'],
    site: 'https://en.wikipedia.org/wiki/Gast%C3%B3n_Acurio',
  },
  {
    title: 'Elena Arzak',
    wiki: 'Elena Arzak',
    born: '1969-07-04',
    nationality: 'Spanish',
    geo: [43.3183, -1.9812, 'San Sebastián'],
    site: 'https://en.wikipedia.org/wiki/Elena_Arzak',
  },
  {
    title: 'Yotam Ottolenghi',
    wiki: 'Yotam Ottolenghi',
    born: '1968-12-14',
    nationality: 'British',
    geo: [51.5074, -0.1278, 'London'],
    site: 'https://en.wikipedia.org/wiki/Yotam_Ottolenghi',
  },
];

const RESTAURANTS = [
  {
    title: 'elBulli',
    wiki: 'El Bulli',
    pdf: true,
    chef: 'Ferran Adrià',
    geo: [42.25, 3.226, 'Cala Montjoi'],
    opened: ['1964-01-01', '2011-07-30'],
  },
  {
    title: 'Osteria Francescana',
    wiki: 'Osteria Francescana',
    pdf: true,
    chef: 'Massimo Bottura',
    geo: [44.6448, 10.9266, 'Modena'],
    opened: ['1995-03-19', null],
  },
  {
    title: 'Chez Panisse',
    wiki: 'Chez Panisse',
    pdf: true,
    chef: 'Alice Waters',
    geo: [37.8796, -122.2691, 'Berkeley'],
    opened: ['1971-08-28', null],
  },
  {
    title: 'Matsuhisa',
    wiki: 'Nobu (restaurant)',
    pdf: true,
    chef: 'Nobu Matsuhisa',
    geo: [34.067, -118.4, 'Beverly Hills'],
    opened: ['1987-01-01', null],
  },
  {
    title: 'Astrid y Gastón',
    wiki: 'Astrid & Gaston',
    pdf: true,
    chef: 'Gastón Acurio',
    geo: [-12.096, -77.035, 'Lima'],
    opened: ['1994-01-01', null],
  },
  {
    title: 'Arzak',
    wiki: 'Arzak',
    pdf: true,
    chef: 'Elena Arzak',
    geo: [43.321, -1.967, 'San Sebastián'],
    opened: ['1897-01-01', null],
  },
];

const RECIPES = [
  {
    title: 'Paella',
    wiki: 'Paella',
    pdf: true,
    chef: 'Elena Arzak',
    restaurant: 'Arzak',
    ingredients: ['Rice', 'Saffron', 'Tomato', 'Garlic', 'Olive oil'],
    diet: ['Omnivore', 'Gluten-free'],
    season: ['Summer', 'Autumn'],
    course: 'Main',
    servings: 6,
    publishedOn: '2018-06-12',
    festivals: ['2019-03-19', '2020-03-19'],
    developed: ['2016-01-01', '2018-06-01'],
    windows: [
      ['2024-06-01', '2024-08-31'],
      ['2025-06-01', '2025-08-31'],
    ],
    video: true,
    audio: true,
  },
  {
    title: 'Ratatouille',
    wiki: 'Ratatouille',
    pdf: true,
    chef: 'Julia Child',
    restaurant: 'Chez Panisse',
    ingredients: ['Eggplant', 'Tomato', 'Garlic', 'Olive oil', 'Onion', 'Basil'],
    diet: ['Vegan', 'Vegetarian', 'Gluten-free'],
    season: ['Summer'],
    course: 'Main',
    servings: 4,
    publishedOn: '1961-10-16',
    festivals: ['2023-08-15'],
    developed: ['1950-01-01', '1961-10-16'],
    windows: [['2024-07-01', '2024-09-15']],
    audio: true,
  },
  {
    title: 'Pho',
    wiki: 'Pho',
    pdf: true,
    chef: 'Yotam Ottolenghi',
    restaurant: 'Chez Panisse',
    ingredients: ['Onion', 'Lime', 'Fish sauce', 'Garlic'],
    diet: ['Omnivore'],
    season: ['Winter', 'Autumn'],
    course: 'Soup',
    servings: 4,
    publishedOn: '2012-09-01',
    festivals: ['2022-02-01', '2023-02-01'],
    developed: ['2010-01-01', '2012-09-01'],
    windows: [['2024-11-01', '2025-02-28']],
    audio: true,
  },
  {
    title: 'Ceviche',
    wiki: 'Ceviche',
    pdf: true,
    chef: 'Gastón Acurio',
    restaurant: 'Astrid y Gastón',
    ingredients: ['Lime', 'Onion', 'Garlic', 'Fish sauce'],
    diet: ['Omnivore', 'Gluten-free'],
    season: ['Summer'],
    course: 'Starter',
    servings: 2,
    publishedOn: '2009-04-22',
    festivals: ['2024-01-15'],
    developed: ['2005-01-01', '2009-04-22'],
    windows: [['2024-12-01', '2025-03-01']],
    video: true,
  },
  {
    title: 'Tiramisu',
    wiki: 'Tiramisu',
    pdf: true,
    chef: 'Massimo Bottura',
    restaurant: 'Osteria Francescana',
    ingredients: ['Egg', 'Mascarpone', 'Coffee'],
    diet: ['Vegetarian'],
    season: ['Winter', 'Autumn'],
    course: 'Dessert',
    servings: 8,
    publishedOn: '1998-11-02',
    festivals: ['2023-12-24'],
    developed: ['1995-01-01', '1998-11-02'],
    windows: [
      ['2024-10-01', '2025-01-06'],
      ['2025-10-01', '2026-01-06'],
    ],
    video: true,
  },
  {
    title: 'Sushi',
    wiki: 'Sushi',
    pdf: true,
    chef: 'Nobu Matsuhisa',
    restaurant: 'Matsuhisa',
    ingredients: ['Rice', 'Fish sauce', 'Lime'],
    diet: ['Omnivore', 'Gluten-free'],
    season: ['Spring', 'Winter'],
    course: 'Main',
    servings: 2,
    publishedOn: '1987-06-01',
    festivals: ['2024-05-05'],
    developed: ['1985-01-01', '1987-06-01'],
    windows: [['2024-01-01', '2024-12-31']],
    video: true,
  },
  {
    title: 'Gazpacho',
    wiki: 'Gazpacho',
    pdf: true,
    chef: 'Elena Arzak',
    restaurant: 'Arzak',
    ingredients: ['Tomato', 'Garlic', 'Olive oil', 'Onion'],
    diet: ['Vegan', 'Vegetarian', 'Gluten-free'],
    season: ['Summer'],
    course: 'Starter',
    servings: 4,
    publishedOn: '2011-07-08',
    festivals: ['2024-06-24'],
    developed: ['2008-01-01', '2011-07-08'],
    windows: [['2024-06-01', '2024-09-30']],
  },
  {
    title: 'Shakshuka',
    wiki: 'Shakshouka',
    pdf: true,
    chef: 'Yotam Ottolenghi',
    restaurant: 'Chez Panisse',
    ingredients: ['Tomato', 'Egg', 'Garlic', 'Olive oil', 'Onion'],
    diet: ['Vegetarian', 'Gluten-free'],
    season: ['Spring', 'Winter'],
    course: 'Main',
    servings: 3,
    publishedOn: '2014-05-10',
    festivals: ['2023-04-09'],
    developed: ['2012-01-01', '2014-05-10'],
    windows: [['2024-03-01', '2024-05-31']],
  },
  {
    title: 'Pad Thai',
    wiki: 'Pad thai',
    pdf: true,
    chef: 'Yotam Ottolenghi',
    restaurant: 'Matsuhisa',
    ingredients: ['Fish sauce', 'Lime', 'Egg', 'Garlic', 'Coconut milk'],
    diet: ['Omnivore'],
    season: ['Spring', 'Summer'],
    course: 'Main',
    servings: 2,
    publishedOn: '2016-03-03',
    festivals: ['2024-07-01'],
    developed: ['2014-01-01', '2016-03-03'],
    windows: [['2024-04-01', '2024-09-01']],
    video: true,
  },
  {
    title: 'Feijoada',
    wiki: 'Feijoada',
    pdf: true,
    chef: 'Gastón Acurio',
    restaurant: 'Astrid y Gastón',
    ingredients: ['Pork', 'Onion', 'Garlic', 'Olive oil'],
    diet: ['Omnivore'],
    season: ['Winter'],
    course: 'Main',
    servings: 8,
    publishedOn: '2010-09-07',
    festivals: ['2022-09-07'],
    developed: ['2008-01-01', '2010-09-07'],
    windows: [['2024-06-01', '2024-08-01']],
    published: false,
  },
  {
    title: 'Miso soup',
    wiki: 'Miso soup',
    pdf: true,
    chef: 'Nobu Matsuhisa',
    restaurant: 'Matsuhisa',
    ingredients: ['Miso', 'Onion', 'Garlic'],
    diet: ['Vegetarian', 'Vegan', 'Gluten-free'],
    season: ['Winter', 'Spring'],
    course: 'Soup',
    servings: 4,
    publishedOn: '2001-02-14',
    festivals: ['2024-01-01'],
    developed: ['1999-01-01', '2001-02-14'],
    windows: [['2024-11-01', '2025-03-01']],
    published: false,
  },
  {
    title: 'Cassoulet',
    wiki: 'Cassoulet',
    pdf: true,
    chef: 'Alice Waters',
    restaurant: 'Chez Panisse',
    ingredients: ['Pork', 'Onion', 'Garlic', 'Tomato'],
    diet: ['Omnivore'],
    season: ['Winter', 'Autumn'],
    course: 'Main',
    servings: 6,
    publishedOn: '1978-11-20',
    festivals: ['2023-11-11'],
    developed: ['1973-01-01', '1978-11-20'],
    windows: [['2024-10-01', '2025-02-28']],
    audio: true,
  },
];

function attribution(title, extract, lang = 'en') {
  const label = lang === 'es' ? `${title} en Wikipedia` : `${title} on Wikipedia`;
  return `${extract}

---

Source: [${label}](${wikiUrl(title, lang)}), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).`;
}

async function createThesaurus(def) {
  const existing = asList(await api('GET', '/api/dictionaries')).find(row => row.name === def.name);
  if (existing) {
    log(`reusing thesaurus ${def.name}`);
    return { ...existing, byLabel: flattenThesaurus(existing.values) };
  }
  const created = await api('POST', '/api/thesauris', def);
  return { ...created, byLabel: flattenThesaurus(created.values) };
}

async function createRelationType(name) {
  const existing = asList(await api('GET', '/api/relationtypes')).find(row => row.name === name);
  if (existing) {
    log(`reusing relation type ${name}`);
    return existing;
  }
  return api('POST', '/api/relationtypes', { name });
}

async function commonProperties() {
  const templates = asList(await api('GET', '/api/templates'));
  const source = templates.find(template => (template.commonProperties || []).length);
  if (!source) throw new Error('No template with commonProperties found');
  return source.commonProperties.map(({ _id, id, ...rest }) => rest);
}

async function createTemplate(name, properties, { color, isDefault } = {}) {
  return api('POST', '/api/templates', {
    name,
    color,
    default: Boolean(isDefault),
    commonProperties: await commonProperties(),
    properties,
  });
}

async function createEntity(payload) {
  return api('POST', '/api/entities', { language: 'en', published: true, ...payload });
}

async function waitForPdfs(entries) {
  const pending = entries.filter(entry => entry.pdfFile);
  const started = Date.now();
  while (pending.length && Date.now() - started < 45_000) {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const entry = pending[i];
      const files = asList(await api('GET', `/api/files?_id=${idOf(entry.pdfFile)}`));
      const file = files[0];
      if (file?.status === 'ready' || file?.status === 'failed') {
        if (file.status === 'failed') log(`conversion failed for ${entry.entity.title}`);
        entry.pdfFile = file;
        pending.splice(i, 1);
      }
    }
    if (pending.length) {
      log(`waiting on ${pending.length} PDF conversion(s)`);
      await sleep(3000);
    }
  }
  for (const entry of pending) {
    log(`conversion still pending for ${entry.entity.title}; continuing`);
  }
}

async function searchByTemplate(templateId, lang = 'en') {
  const query = new URLSearchParams({
    limit: '80',
    includeUnpublished: 'true',
    types: JSON.stringify([templateId]),
  });
  return asList(await raw('GET', `/api/search?${query}`, { headers: { 'Accept-Language': lang } }));
}

async function resetKitchen() {
  const templates = asList(await api('GET', '/api/templates')).filter(template =>
    KITCHEN_TEMPLATE_NAMES.includes(template.name)
  );
  if (!templates.length) {
    log('reset: nothing to delete');
    return;
  }

  const sharedIds = [];
  for (const template of templates) {
    const rows = await searchByTemplate(idOf(template));
    sharedIds.push(...rows.map(row => row.sharedId).filter(Boolean));
  }
  if (sharedIds.length) {
    log(`reset: deleting ${sharedIds.length} entities`);
    await api('POST', '/api/entities/bulkdelete', { sharedIds });
  }

  for (const name of ['Recipe', 'Restaurant', 'Chef', 'Ingredient']) {
    const template = templates.find(row => row.name === name);
    if (template) {
      log(`reset: template ${name}`);
      await raw('DELETE', `/api/templates?_id=${idOf(template)}`);
    }
  }

  const thesauri = asList(await api('GET', '/api/dictionaries'));
  for (const name of ['Cuisine', 'Diet', 'Season', 'Course', 'Nationality']) {
    const thesaurus = thesauri.find(row => row.name === name);
    if (thesaurus) {
      log(`reset: thesaurus ${name}`);
      await raw('DELETE', `/api/thesauris?_id=${idOf(thesaurus)}`);
    }
  }

  const relationTypes = asList(await api('GET', '/api/relationtypes'));
  for (const name of ['uses ingredient', 'created by', 'served at', 'cited in']) {
    const relationType = relationTypes.find(row => row.name === name);
    if (!relationType) continue;
    try {
      log(`reset: relation type ${name}`);
      await raw('DELETE', `/api/relationtypes?_id=${idOf(relationType)}`);
    } catch (error) {
      log(`reset: could not delete relation type ${name} (${error.message.slice(0, 80)})`);
    }
  }

  await resetCookbookArtifacts();
}

async function resetCookbookArtifacts() {
  const pages = asList(await raw('GET', '/api/pages', { headers: { 'Accept-Language': 'en' } }));
  for (const page of pages) {
    if (page.title !== PAGE_TITLE_EN && page.title !== PAGE_TITLE_ES) continue;
    log(`reset: page ${page.title}`);
    try {
      await raw('DELETE', `/api/pages?sharedId=${page.sharedId}`);
    } catch (error) {
      log(`reset: could not delete page (${error.message.slice(0, 80)})`);
    }
  }

  const dataviz = asList(await api('GET', '/api/dataviz'));
  for (const row of dataviz) {
    if (row.name !== DATAVIZ_DIET_NAME && row.name !== DATAVIZ_COURSE_NAME) continue;
    log(`reset: dataviz ${row.name}`);
    try {
      await raw('DELETE', `/api/dataviz/${row.id}`);
    } catch (error) {
      log(`reset: could not delete dataviz ${row.name} (${error.message.slice(0, 80)})`);
    }
  }

  const links = asList(await api('GET', '/api/settings/links'));
  const next = links.filter(link => link.title !== PAGE_TITLE_EN && link.title !== PAGE_TITLE_ES);
  if (next.length !== links.length) {
    log('reset: menu Cookbook link');
    await api('POST', '/api/settings/links', next);
  }
}

async function kitchenTemplates() {
  return asList(await api('GET', '/api/templates')).filter(template =>
    KITCHEN_TEMPLATE_NAMES.includes(template.name)
  );
}

async function ensureEmptyKitchen() {
  const clash = await kitchenTemplates();
  if (!clash.length) return { enrich: false };
  if (process.argv.includes('--reset')) {
    await resetKitchen();
    return { enrich: false };
  }
  log(`kitchen templates already exist (${clash.map(t => t.name).join(', ')}); enriching`);
  return { enrich: true };
}

async function publishSharedIds(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return;
  await api('POST', '/api/entities/permissions', {
    ids: unique,
    permissions: [{ refId: 'public', type: 'public', level: 'read' }],
  });
  log(`published ${unique.length} entities`);
}

function rangeValue(from, to) {
  return { from: unix(from), to: to ? unix(to) : null };
}

function wikiCatalog() {
  const titles = new Map();
  for (const row of [...INGREDIENTS, ...CHEFS, ...RESTAURANTS, ...RECIPES]) {
    if (row.wiki) titles.set(row.wiki, row.pdf === true);
  }
  return titles;
}

function isUsableWikiSummary(summary) {
  return Boolean(summary?.extract) && summary.type !== 'disambiguation';
}

function isEnglishPdf(file) {
  return file.type === 'document' && file.language !== 'spa' && file.language !== 'es';
}

async function prefetchWiki() {
  const titles = wikiCatalog();
  const summaries = {};
  const pdfs = {};
  const images = {};
  for (const [title, needsPdf] of titles) {
    log(`wikipedia ${title}${needsPdf ? ' (pdf)' : ''}`);
    try {
      const summary = await loadSummary(title);
      if (!isUsableWikiSummary(summary)) {
        throw new Error(`unusable summary (${summary?.type || 'empty'})`);
      }
      summaries[title] = summary;
      const image = await loadImage(title, summary);
      if (image) images[title] = image;
      if (needsPdf) pdfs[title] = await loadPdf(title);
    } catch (error) {
      log(`skip wiki ${title}: ${error.message}`);
    }
  }
  return { summaries, pdfs, images };
}

function fileUrl(uploaded) {
  const filename = uploaded?.filename;
  if (!filename) throw new Error('Upload response missing filename');
  return `/api/files/${filename}`;
}

async function attachMedia(entity, extraMetadata, attachments = []) {
  return api('POST', '/api/entities', {
    _id: idOf(entity),
    sharedId: entity.sharedId,
    title: entity.title,
    template: entity.template,
    language: 'en',
    attachments: attachments.map(file => ({
      _id: idOf(file),
      originalname: file.originalname,
    })),
    metadata: { ...(entity.metadata || {}), ...extraMetadata },
  });
}

async function saveTextRef({ sourceSharedId, sourceFileId, snippet, targetSharedId, relationTypeId }) {
  if (!snippet || !sourceFileId) return;
  const reference = {
    text: snippet,
    selectionRectangles: [{ page: '1', top: 90, left: 48, width: 460, height: 28 }],
  };
  await api('POST', '/api/relationships/bulk', {
    delete: [],
    save: [
      [
        {
          entity: sourceSharedId,
          template: null,
          file: sourceFileId,
          reference,
        },
        {
          entity: targetSharedId,
          template: relationTypeId,
        },
      ],
    ],
  });
}

async function getEntity(sharedId, lang) {
  const body = await raw('GET', `/api/entities?sharedId=${encodeURIComponent(sharedId)}`, {
    headers: { 'Accept-Language': lang },
  });
  return asList(body)[0];
}

async function loadFilesByEntity() {
  const documents = asList(await api('GET', '/api/files?type=document'));
  const attachments = asList(await api('GET', '/api/files?type=attachment'));
  const map = {};
  for (const file of [...documents, ...attachments]) {
    if (!file.entity) continue;
    (map[file.entity] ||= []).push(file);
  }
  return map;
}

function isSpanishPdf(file) {
  return file.type === 'document' && (file.language === 'spa' || file.language === 'es');
}

async function setFileLanguage(file, language) {
  const fileId = idOf(file);
  if (!fileId || file.language === language) return file;
  log(`setting ${file.originalname || fileId} language ${file.language || '?'} → ${language}`);
  return api('POST', '/api/files', { _id: fileId, language });
}

function fileTime(file) {
  return file.creationDate || Number.parseInt(String(file.filename || '').slice(0, 13), 10) || 0;
}

async function repairRestaurantPdfLanguages(ctx) {
  const files = await loadFilesByEntity();
  for (const row of RESTAURANTS) {
    const sharedId = ctx.restaurantEntities[row.title].entity.sharedId;
    const docs = (files[sharedId] || []).filter(file => file.type === 'document');
    const spa = docs.filter(isSpanishPdf);
    const eng = docs.filter(isEnglishPdf);
    if (spa.length && eng.length) continue;
    if (eng.length >= 2) {
      const newest = [...eng].sort((a, b) => fileTime(a) - fileTime(b)).at(-1);
      await setFileLanguage(newest, 'spa');
    }
  }
}

async function saveSpanishEntity(enEntity, { title, metadata }, files) {
  const esRow = await getEntity(enEntity.sharedId, 'es');
  if (!esRow) throw new Error(`No Spanish entity row for ${enEntity.title} (${enEntity.sharedId})`);
  const entityFiles = files[enEntity.sharedId] || [];
  const documents = entityFiles.filter(file => file.type === 'document');
  const attachments = entityFiles.filter(file => file.type === 'attachment');
  return raw('POST', '/api/entities', {
    json: {
      _id: idOf(esRow),
      sharedId: enEntity.sharedId,
      title,
      template: enEntity.template,
      language: 'es',
      documents: documents.map(file => ({ _id: idOf(file), originalname: file.originalname })),
      attachments: attachments.map(file => ({
        _id: idOf(file),
        originalname: file.originalname,
      })),
      metadata: { ...(enEntity.metadata || {}), ...metadata },
    },
    headers: { 'Accept-Language': 'es' },
  });
}

async function ensureSpanishLanguage() {
  const settings = await api('GET', '/api/settings');
  const existing = (settings.languages || []).find(language => language.key === 'es');
  if (!existing) {
    log('adding Spanish language');
    await api('POST', '/api/translations/languages', [SPANISH_LANGUAGE]);
  }
  const started = Date.now();
  while (Date.now() - started < 180_000) {
    const current = await api('GET', '/api/settings');
    const language = (current.languages || []).find(row => row.key === 'es');
    if (language && !language.installing) {
      log('Spanish language ready');
      return;
    }
    log('waiting for Spanish language install');
    await sleep(2500);
  }
  throw new Error('Spanish language install timed out (is the queue worker running?)');
}

async function prefetchWikiEs() {
  const summaries = {};
  const pdfs = {};
  const titles = wikiCatalog();
  for (const [enTitle, needsPdf] of titles) {
    const esTitle = WIKI_ES[enTitle] || enTitle;
    log(`wikipedia es ${esTitle}${needsPdf ? ' (pdf)' : ''}`);
    try {
      const summary = await loadSummary(esTitle, 'es');
      if (!isUsableWikiSummary(summary)) {
        throw new Error(`unusable summary (${summary?.type || 'empty'})`);
      }
      summaries[enTitle] = summary;
      if (needsPdf) pdfs[enTitle] = await loadPdf(esTitle, 'es');
    } catch (error) {
      log(`es wiki failed for ${esTitle}: ${error.message}; trying EN`);
      try {
        summaries[enTitle] = await loadSummary(enTitle, 'en');
        if (needsPdf) pdfs[enTitle] = await loadPdf(enTitle, 'en');
      } catch (fallback) {
        log(`skip wiki es ${enTitle}: ${fallback.message}`);
      }
    }
  }
  return { summaries, pdfs };
}

async function patchSpanishTranslations() {
  const payload = await api('GET', '/api/translations?locale=es');
  const doc = asList(payload)[0];
  if (!doc?.contexts) {
    log('no Spanish translations document to patch');
    return;
  }
  const contexts = [];
  for (const ctx of doc.contexts) {
    const values = { ...(ctx.values || {}) };
    let changed = false;
    for (const [en, es] of Object.entries(I18N_ES)) {
      if (en in values && values[en] !== es) {
        values[en] = es;
        changed = true;
      }
    }
    if (changed) contexts.push({ ...ctx, values });
  }
  if (!contexts.length) {
    log('translation keys already in Spanish');
    return;
  }
  await api('POST', '/api/translations', {
    _id: idOf(doc),
    locale: 'es',
    contexts,
  });
  log(`patched ${contexts.length} translation contexts`);
}

async function loadKitchenContext() {
  const templates = await kitchenTemplates();
  const byTpl = name => {
    const template = templates.find(row => row.name === name);
    if (!template) throw new Error(`Missing template ${name}`);
    return template;
  };
  const thesauri = asList(await api('GET', '/api/dictionaries'));
  const wrapThesaurus = name => {
    const row = thesauri.find(item => item.name === name);
    if (!row) throw new Error(`Missing thesaurus ${name}`);
    return { ...row, byLabel: flattenThesaurus(row.values) };
  };
  const ingredientTpl = byTpl('Ingredient');
  const chefTpl = byTpl('Chef');
  const restaurantTpl = byTpl('Restaurant');
  const recipeTpl = byTpl('Recipe');

  const mapEntities = async (template, rows) => {
    const found = await searchByTemplate(idOf(template), 'en');
    const byTitle = Object.fromEntries(found.map(entity => [entity.title, entity]));
    const out = {};
    for (const row of rows) {
      const entity = byTitle[row.title];
      if (!entity) throw new Error(`Missing entity ${row.title}`);
      out[row.title] = { entity, wiki: row.wiki, row, pdfFile: null };
    }
    return out;
  };

  return {
    ingredientTpl,
    chefTpl,
    restaurantTpl,
    recipeTpl,
    cuisine: wrapThesaurus('Cuisine'),
    diet: wrapThesaurus('Diet'),
    season: wrapThesaurus('Season'),
    course: wrapThesaurus('Course'),
    nationality: wrapThesaurus('Nationality'),
    ingredientEntities: await mapEntities(ingredientTpl, INGREDIENTS),
    chefEntities: await mapEntities(chefTpl, CHEFS),
    restaurantEntities: await mapEntities(restaurantTpl, RESTAURANTS),
    recipeEntities: await mapEntities(recipeTpl, RECIPES),
  };
}

async function ensureEnglishRestaurantPdfs(ctx) {
  const files = await loadFilesByEntity();
  const missing = RESTAURANTS.filter(row => {
    if (!row.pdf) return false;
    const entry = ctx.restaurantEntities[row.title];
    return !(files[entry.entity.sharedId] || []).some(isEnglishPdf);
  });
  if (!missing.length) {
    log('restaurant English PDFs already present');
    return;
  }
  log(`fetching English Wikipedia PDFs for ${missing.length} restaurants`);
  const wiki = await prefetchWiki();
  const uploaded = [];
  for (const row of missing) {
    const entry = ctx.restaurantEntities[row.title];
    if (!wiki.pdfs[row.wiki]) {
      log(`no English PDF for restaurant ${row.title}`);
      continue;
    }
    const pdfFile = await upload(
      'document',
      entry.entity.sharedId,
      `${wikiSlug(row.wiki)}.pdf`,
      'application/pdf',
      wiki.pdfs[row.wiki],
      'en'
    );
    entry.pdfFile = pdfFile;
    uploaded.push(entry);
    log(`restaurant en pdf ${row.title}`);
  }
  if (uploaded.length) {
    log('waiting for English restaurant PDF conversion');
    await waitForPdfs(uploaded);
  }
}

async function ensureSpanish(ctx) {
  await ensureSpanishLanguage();
  const wikiEs = await prefetchWikiEs();
  const files = await loadFilesByEntity();

  log('translating ingredients');
  for (const row of INGREDIENTS) {
    const entry = ctx.ingredientEntities[row.title];
    const wikiTitle = WIKI_ES[row.wiki] || row.wiki;
    const extract =
      wikiEs.summaries[row.wiki]?.extract ||
      `${TITLE_ES[row.title] || row.title} forma parte del recetario.`;
    await saveSpanishEntity(
      entry.entity,
      {
        title: TITLE_ES[row.title] || row.title,
        metadata: {
          [propName(ctx.ingredientTpl, 'Description')]: val(extract.slice(0, 400)),
        },
      },
      files
    );
    if (row.pdf && wikiEs.pdfs[row.wiki] && !(files[entry.entity.sharedId] || []).some(isSpanishPdf)) {
      const pdfFile = await upload(
        'document',
        entry.entity.sharedId,
        `${wikiSlug(wikiTitle)}.pdf`,
        'application/pdf',
        wikiEs.pdfs[row.wiki],
        'es'
      );
      (files[entry.entity.sharedId] ||= []).push(pdfFile);
    }
    log(`ingredient es ${TITLE_ES[row.title] || row.title}`);
  }

  log('translating chefs');
  for (const row of CHEFS) {
    const entry = ctx.chefEntities[row.title];
    const wikiTitle = WIKI_ES[row.wiki] || row.wiki;
    const extract =
      wikiEs.summaries[row.wiki]?.extract ||
      `${row.title} forma parte del recetario.`;
    await saveSpanishEntity(
      entry.entity,
      {
        title: TITLE_ES[row.title] || row.title,
        metadata: {
          [propName(ctx.chefTpl, 'Biography')]: val(attribution(wikiTitle, extract, 'es')),
          [propName(ctx.chefTpl, 'Website')]: val({
            label: 'Wikipedia',
            url: wikiUrl(wikiTitle, 'es'),
          }),
        },
      },
      files
    );
    if (row.pdf && wikiEs.pdfs[row.wiki] && !(files[entry.entity.sharedId] || []).some(isSpanishPdf)) {
      const pdfFile = await upload(
        'document',
        entry.entity.sharedId,
        `${wikiSlug(wikiTitle)}.pdf`,
        'application/pdf',
        wikiEs.pdfs[row.wiki],
        'es'
      );
      (files[entry.entity.sharedId] ||= []).push(pdfFile);
    }
    log(`chef es ${row.title}`);
  }

  log('translating restaurants');
  for (const row of RESTAURANTS) {
    const entry = ctx.restaurantEntities[row.title];
    await saveSpanishEntity(
      entry.entity,
      { title: TITLE_ES[row.title] || row.title, metadata: {} },
      files
    );
    const docs = (files[entry.entity.sharedId] || []).filter(file => file.type === 'document');
    if (
      row.pdf &&
      wikiEs.pdfs[row.wiki] &&
      !docs.some(isSpanishPdf) &&
      docs.length < 2
    ) {
      const wikiTitle = WIKI_ES[row.wiki] || row.wiki;
      const pdfFile = await upload(
        'document',
        entry.entity.sharedId,
        `${wikiSlug(wikiTitle)}.pdf`,
        'application/pdf',
        wikiEs.pdfs[row.wiki],
        'es'
      );
      (files[entry.entity.sharedId] ||= []).push(pdfFile);
    }
    log(`restaurant es ${row.title}`);
  }

  log('translating recipes');
  for (const row of RECIPES) {
    const entry = ctx.recipeEntities[row.title];
    const wikiTitle = WIKI_ES[row.wiki] || row.wiki;
    const extract =
      wikiEs.summaries[row.wiki]?.extract || `${row.title} es un plato del recetario.`;
    const titleEs = TITLE_ES[row.title] || row.title;
    await saveSpanishEntity(
      entry.entity,
      {
        title: titleEs,
        metadata: {
          [propName(ctx.recipeTpl, 'Method')]: val(attribution(wikiTitle, extract, 'es')),
          [propName(ctx.recipeTpl, 'Wikipedia')]: val({
            label: `${titleEs} en Wikipedia`,
            url: wikiUrl(wikiTitle, 'es'),
          }),
        },
      },
      files
    );
    if (wikiEs.pdfs[row.wiki] && !(files[entry.entity.sharedId] || []).some(isSpanishPdf)) {
      const pdfFile = await upload(
        'document',
        entry.entity.sharedId,
        `${wikiSlug(wikiTitle)}.pdf`,
        'application/pdf',
        wikiEs.pdfs[row.wiki],
        'es'
      );
      (files[entry.entity.sharedId] ||= []).push(pdfFile);
    }
    log(`recipe es ${titleEs}`);
  }

  const esPdfs = [
    ...INGREDIENTS.filter(row => row.pdf).map(row => ({
      entity: ctx.ingredientEntities[row.title].entity,
      pdfFile: (files[ctx.ingredientEntities[row.title].entity.sharedId] || []).find(isSpanishPdf),
    })),
    ...CHEFS.filter(row => row.pdf).map(row => ({
      entity: ctx.chefEntities[row.title].entity,
      pdfFile: (files[ctx.chefEntities[row.title].entity.sharedId] || []).find(isSpanishPdf),
    })),
    ...RESTAURANTS.filter(row => row.pdf).map(row => ({
      entity: ctx.restaurantEntities[row.title].entity,
      pdfFile: (files[ctx.restaurantEntities[row.title].entity.sharedId] || []).find(isSpanishPdf),
    })),
    ...RECIPES.map(row => ({
      entity: ctx.recipeEntities[row.title].entity,
      pdfFile: (files[ctx.recipeEntities[row.title].entity.sharedId] || []).find(isSpanishPdf),
    })),
  ];
  log('waiting for Spanish PDF conversion');
  await waitForPdfs(esPdfs);
  await repairRestaurantPdfLanguages(ctx);
  await patchSpanishTranslations();
}

function cookbookHtml(dietId, courseId, lang) {
  if (lang === 'es') {
    return `<h1>Recetario</h1>
<p>Un recetario de platos, chefs e ingredientes. Los gráficos cuentan las recetas por dieta y por tipo de plato.</p>
<h2>Recetas por dieta</h2>
<Dataviz id="${dietId}" />
<h2>Recetas por plato</h2>
<Dataviz id="${courseId}" />`;
  }
  return `<h1>Cookbook</h1>
<p>A small cookbook of dishes, chefs and ingredients. The charts below count recipes by diet and by course.</p>
<h2>Recipes by diet</h2>
<Dataviz id="${dietId}" />
<h2>Recipes by course</h2>
<Dataviz id="${courseId}" />`;
}

async function ensureDataviz(recipeTpl) {
  const existing = asList(await api('GET', '/api/dataviz'));
  const templateId = idOf(recipeTpl);
  const make = async (name, chartType, property, propertyType) => {
    const found = existing.find(row => row.name === name);
    if (found) {
      log(`reusing dataviz ${name}`);
      return found;
    }
    log(`creating dataviz ${name}`);
    return api('POST', '/api/dataviz', {
      name,
      description: '',
      query: {
        sources: [{ templateId }],
        dimensions: [{ property, propertyType, bucketStrategy: 'terms', sort: 'count_desc' }],
        measures: [{ aggregation: 'count', countMode: 'all' }],
        includeUnpublished: true,
        language: 'en',
        limit: 50,
      },
      chart: { type: chartType, showLegend: true, showTooltip: true, showLabels: true },
      appearance: { colorMode: 'theme' },
      refresh: { refreshMode: 'live' },
      embedPublic: true,
    });
  };
  const diet = await make(DATAVIZ_DIET_NAME, 'pie', propName(recipeTpl, 'Diet'), 'multiselect');
  const course = await make(DATAVIZ_COURSE_NAME, 'bar', propName(recipeTpl, 'Course'), 'select');
  return { diet, course };
}

async function ensureCookbookPage(ctx) {
  const { diet, course } = await ensureDataviz(ctx.recipeTpl);
  const dietId = diet.id || idOf(diet);
  const courseId = course.id || idOf(course);
  const pages = asList(await raw('GET', '/api/pages', { headers: { 'Accept-Language': 'en' } }));
  let page = pages.find(row => row.title === PAGE_TITLE_EN || row.title === PAGE_TITLE_ES);
  const payload = {
    locales: {
      en: {
        title: PAGE_TITLE_EN,
        draft: { content: cookbookHtml(dietId, courseId, 'en'), script: '', css: '' },
      },
      es: {
        title: PAGE_TITLE_ES,
        draft: { content: cookbookHtml(dietId, courseId, 'es'), script: '', css: '' },
      },
    },
  };
  if (page?.sharedId) {
    payload.sharedId = page.sharedId;
    log('updating Cookbook page');
  } else {
    log('creating Cookbook page');
  }
  page = await api('POST', '/api/pages', payload);
  await api('POST', '/api/pages/release', {
    sharedId: page.sharedId,
    release_message: 'kitchen seed',
  });
  const url = `/page/${page.sharedId}/cookbook`;
  const links = asList(await api('GET', '/api/settings/links'));
  if (!links.some(link => link.url === url || link.title === PAGE_TITLE_EN)) {
    log('adding Cookbook menu link');
    await api('POST', '/api/settings/links', [
      ...links,
      { type: 'link', title: PAGE_TITLE_EN, url },
    ]);
  }
  await patchSpanishTranslations();
}

async function main() {
  await login();
  const { enrich } = await ensureEmptyKitchen();
  if (enrich) {
    const ctx = await loadKitchenContext();
    await ensureEnglishRestaurantPdfs(ctx);
    await ensureSpanish(ctx);
    await ensureCookbookPage(ctx);
    log('done (enriched existing kitchen with Spanish + Cookbook page)');
    return;
  }

  log('fetching Wikipedia assets');
  const wiki = await prefetchWiki();
  const wav = makeWav();
  const mp4 = makeMp4();

  log('creating thesauri and relation types');
  const cuisine = await createThesaurus(CUISINE);
  const diet = await createThesaurus(DIET);
  const season = await createThesaurus(SEASON);
  const course = await createThesaurus(COURSE);
  const nationality = await createThesaurus(NATIONALITY);
  const usesIngredient = await createRelationType('uses ingredient');
  const createdBy = await createRelationType('created by');
  const servedAt = await createRelationType('served at');
  const citedIn = await createRelationType('cited in');

  log('creating templates');
  const ingredientTpl = await createTemplate(
    'Ingredient',
    [
      { label: 'Description', type: 'text', showInCard: true },
      { label: 'Botanical name', type: 'text' },
      { label: 'Calories per 100g', type: 'numeric', filter: true, showInCard: true },
      {
        label: 'Cuisine',
        type: 'select',
        content: idOf(cuisine),
        filter: true,
        showInCard: true,
      },
      { label: 'Photo', type: 'image', style: 'cover', showInCard: true },
      { label: 'Catalog ID', type: 'generatedid' },
    ],
    { color: '#2d6a4f' }
  );

  const chefTpl = await createTemplate(
    'Chef',
    [
      { label: 'Biography', type: 'markdown' },
      { label: 'Born', type: 'date', filter: true, prioritySorting: true },
      {
        label: 'Nationality',
        type: 'select',
        content: idOf(nationality),
        filter: true,
        showInCard: true,
      },
      { label: 'Studio', type: 'geolocation' },
      { label: 'Website', type: 'link' },
      { label: 'Portrait', type: 'image', style: 'cover', showInCard: true },
    ],
    { color: '#9b2226' }
  );

  const nationalityProp = propByLabel(chefTpl, 'Nationality');

  const restaurantTpl = await createTemplate(
    'Restaurant',
    [
      { label: 'Open period', type: 'daterange', filter: true },
      { label: 'Location', type: 'geolocation' },
      {
        label: 'Head chef',
        type: 'relationship',
        content: idOf(chefTpl),
        relationType: idOf(createdBy),
        filter: true,
        showInCard: true,
      },
    ],
    { color: '#432818' }
  );

  const recipeTpl = await createTemplate(
    'Recipe',
    [
      { label: 'Method', type: 'markdown' },
      { label: 'Servings', type: 'numeric', filter: true, showInCard: true },
      { label: 'Published on', type: 'date', filter: true, prioritySorting: true },
      { label: 'Festival dates', type: 'multidate' },
      { label: 'Development period', type: 'daterange' },
      { label: 'Service windows', type: 'multidaterange' },
      {
        label: 'Diet',
        type: 'multiselect',
        content: idOf(diet),
        filter: true,
        showInCard: true,
      },
      {
        label: 'Season',
        type: 'multiselect',
        content: idOf(season),
        filter: true,
      },
      {
        label: 'Course',
        type: 'select',
        content: idOf(course),
        filter: true,
        showInCard: true,
      },
      {
        label: 'Ingredients',
        type: 'relationship',
        content: idOf(ingredientTpl),
        relationType: idOf(usesIngredient),
        filter: true,
      },
      {
        label: 'Chef',
        type: 'relationship',
        content: idOf(chefTpl),
        relationType: idOf(createdBy),
        inherit: {
          property: idOf(nationalityProp),
          type: 'select',
        },
        filter: true,
        showInCard: true,
      },
      {
        label: 'Restaurant',
        type: 'relationship',
        content: idOf(restaurantTpl),
        relationType: idOf(servedAt),
      },
      { label: 'Wikipedia', type: 'link' },
      { label: 'Plate photo', type: 'image', style: 'cover', showInCard: true, fullWidth: true },
      { label: 'Document preview', type: 'preview', style: 'cover', showInCard: true },
      { label: 'Demo video', type: 'media', showInCard: true },
      { label: 'Kitchen audio', type: 'media' },
      { label: 'Recipe code', type: 'generatedid' },
    ],
    { color: '#bc6c25', isDefault: true }
  );

  const ingredientEntities = {};
  for (const row of INGREDIENTS) {
    const summary = wiki.summaries[row.wiki];
    const extract = summary?.extract || `${row.title} used across the kitchen dataset.`;
    const entity = await createEntity({
      title: row.title,
      template: idOf(ingredientTpl),
      metadata: {
        [propName(ingredientTpl, 'Description')]: val(extract.slice(0, 400)),
        [propName(ingredientTpl, 'Botanical name')]: row.botanical ? val(row.botanical) : [],
        [propName(ingredientTpl, 'Calories per 100g')]: val(row.kcal),
        [propName(ingredientTpl, 'Cuisine')]: val(cuisine.byLabel[row.cuisine]),
      },
    });
    const extra = {};
    const attachments = [];
    if (wiki.images[row.wiki]) {
      const uploaded = await upload(
        'attachment',
        entity.sharedId,
        `${wikiSlug(row.title)}.jpg`,
        'image/jpeg',
        wiki.images[row.wiki]
      );
      extra[propName(ingredientTpl, 'Photo')] = val(fileUrl(uploaded));
      attachments.push(uploaded);
    }
    const saved = Object.keys(extra).length ? await attachMedia(entity, extra, attachments) : entity;
    let pdfFile;
    if (row.pdf && wiki.pdfs[row.wiki]) {
      pdfFile = await upload(
        'document',
        saved.sharedId,
        `${wikiSlug(row.wiki)}.pdf`,
        'application/pdf',
        wiki.pdfs[row.wiki]
      );
    }
    ingredientEntities[row.title] = { entity: saved, pdfFile, wiki: row.wiki };
    log(`ingredient ${row.title}`);
  }

  const chefEntities = {};
  for (const row of CHEFS) {
    const summary = wiki.summaries[row.wiki];
    const extract = summary?.extract || `${row.title} is part of the kitchen dataset.`;
    const entity = await createEntity({
      title: row.title,
      template: idOf(chefTpl),
      metadata: {
        [propName(chefTpl, 'Biography')]: val(attribution(row.wiki, extract)),
        [propName(chefTpl, 'Born')]: val(unix(row.born)),
        [propName(chefTpl, 'Nationality')]: val(nationality.byLabel[row.nationality]),
        [propName(chefTpl, 'Studio')]: val({ lat: row.geo[0], lon: row.geo[1], label: row.geo[2] }),
        [propName(chefTpl, 'Website')]: val({ label: 'Wikipedia', url: row.site }),
      },
    });
    const extra = {};
    const attachments = [];
    if (wiki.images[row.wiki]) {
      const uploaded = await upload(
        'attachment',
        entity.sharedId,
        `${wikiSlug(row.title)}.jpg`,
        'image/jpeg',
        wiki.images[row.wiki]
      );
      extra[propName(chefTpl, 'Portrait')] = val(fileUrl(uploaded));
      attachments.push(uploaded);
    }
    const saved = Object.keys(extra).length ? await attachMedia(entity, extra, attachments) : entity;
    let pdfFile;
    if (row.pdf && wiki.pdfs[row.wiki]) {
      pdfFile = await upload(
        'document',
        saved.sharedId,
        `${wikiSlug(row.wiki)}.pdf`,
        'application/pdf',
        wiki.pdfs[row.wiki]
      );
    }
    chefEntities[row.title] = { entity: saved, pdfFile, wiki: row.wiki };
    log(`chef ${row.title}`);
  }

  const restaurantEntities = {};
  for (const row of RESTAURANTS) {
    const chef = chefEntities[row.chef];
    const entity = await createEntity({
      title: row.title,
      template: idOf(restaurantTpl),
      metadata: {
        [propName(restaurantTpl, 'Open period')]: val(rangeValue(row.opened[0], row.opened[1])),
        [propName(restaurantTpl, 'Location')]: val({
          lat: row.geo[0],
          lon: row.geo[1],
          label: row.geo[2],
        }),
        [propName(restaurantTpl, 'Head chef')]: val(chef.entity.sharedId),
      },
    });
    let pdfFile;
    if (row.pdf && wiki.pdfs[row.wiki]) {
      pdfFile = await upload(
        'document',
        entity.sharedId,
        `${wikiSlug(row.wiki)}.pdf`,
        'application/pdf',
        wiki.pdfs[row.wiki]
      );
    }
    restaurantEntities[row.title] = { entity, pdfFile, wiki: row.wiki, row };
    log(`restaurant ${row.title}`);
  }

  const recipeEntities = {};
  for (const row of RECIPES) {
    const summary = wiki.summaries[row.wiki];
    const extract = summary?.extract || `${row.title} is a dish in the kitchen dataset.`;
    const entity = await createEntity({
      title: row.title,
      template: idOf(recipeTpl),
      published: row.published !== false,
      metadata: {
        [propName(recipeTpl, 'Method')]: val(attribution(row.wiki, extract)),
        [propName(recipeTpl, 'Servings')]: val(row.servings),
        [propName(recipeTpl, 'Published on')]: val(unix(row.publishedOn)),
        [propName(recipeTpl, 'Festival dates')]: vals(row.festivals.map(unix)),
        [propName(recipeTpl, 'Development period')]: val(rangeValue(row.developed[0], row.developed[1])),
        [propName(recipeTpl, 'Service windows')]: vals(
          row.windows.map(([from, to]) => rangeValue(from, to))
        ),
        [propName(recipeTpl, 'Diet')]: vals(row.diet.map(label => diet.byLabel[label])),
        [propName(recipeTpl, 'Season')]: vals(row.season.map(label => season.byLabel[label])),
        [propName(recipeTpl, 'Course')]: val(course.byLabel[row.course]),
        [propName(recipeTpl, 'Ingredients')]: vals(
          row.ingredients.map(name => ingredientEntities[name].entity.sharedId)
        ),
        [propName(recipeTpl, 'Chef')]: val(chefEntities[row.chef].entity.sharedId),
        [propName(recipeTpl, 'Restaurant')]: val(restaurantEntities[row.restaurant].entity.sharedId),
        [propName(recipeTpl, 'Wikipedia')]: val({ label: `${row.title} on Wikipedia`, url: wikiUrl(row.wiki) }),
      },
    });

    const extra = {};
    const attachments = [];
    if (wiki.images[row.wiki]) {
      const photo = await upload(
        'attachment',
        entity.sharedId,
        `${wikiSlug(row.title)}.jpg`,
        'image/jpeg',
        wiki.images[row.wiki]
      );
      extra[propName(recipeTpl, 'Plate photo')] = val(fileUrl(photo));
      attachments.push(photo);
    }
    if (row.video) {
      const video = await upload(
        'attachment',
        entity.sharedId,
        `${wikiSlug(row.title)}-demo.mp4`,
        'video/mp4',
        mp4
      );
      extra[propName(recipeTpl, 'Demo video')] = val(fileUrl(video));
      attachments.push(video);
    }
    if (row.audio) {
      const audio = await upload(
        'attachment',
        entity.sharedId,
        `${wikiSlug(row.title)}-note.wav`,
        'audio/wav',
        wav
      );
      extra[propName(recipeTpl, 'Kitchen audio')] = val(fileUrl(audio));
      attachments.push(audio);
    }
    const saved = Object.keys(extra).length ? await attachMedia(entity, extra, attachments) : entity;
    let pdfFile;
    if (wiki.pdfs[row.wiki]) {
      pdfFile = await upload(
        'document',
        saved.sharedId,
        `${wikiSlug(row.wiki)}.pdf`,
        'application/pdf',
        wiki.pdfs[row.wiki]
      );
    }
    recipeEntities[row.title] = { entity: saved, pdfFile, wiki: row.wiki, row };
    log(`recipe ${row.title}`);
  }

  const publishIds = [
    ...Object.values(ingredientEntities).map(entry => entry.entity.sharedId),
    ...Object.values(chefEntities).map(entry => entry.entity.sharedId),
    ...Object.values(restaurantEntities).map(entry => entry.entity.sharedId),
    ...Object.values(recipeEntities)
      .filter(entry => entry.row.published !== false)
      .map(entry => entry.entity.sharedId),
  ];
  await publishSharedIds(publishIds);

  log('waiting for PDF conversion');
  await waitForPdfs([
    ...Object.values(recipeEntities),
    ...Object.values(ingredientEntities),
    ...Object.values(chefEntities),
    ...Object.values(restaurantEntities),
  ]);

  log('creating text references');
  for (const entry of Object.values(recipeEntities)) {
    const fileId = idOf(entry.pdfFile);
    if (!fileId) continue;
    const extract = wiki.summaries[entry.wiki]?.extract || '';
    const firstIngredient = entry.row.ingredients[0];
    const snippet = pickSnippet(extract, [
      firstIngredient,
      ...entry.row.ingredients.slice(1),
      entry.row.chef.split(' ').pop(),
      entry.title,
    ]);
    await saveTextRef({
      sourceSharedId: entry.entity.sharedId,
      sourceFileId: fileId,
      snippet,
      targetSharedId: ingredientEntities[firstIngredient].entity.sharedId,
      relationTypeId: idOf(citedIn),
    });
    if (entry.row.ingredients[1]) {
      const second = entry.row.ingredients[1];
      await saveTextRef({
        sourceSharedId: entry.entity.sharedId,
        sourceFileId: fileId,
        snippet: pickSnippet(extract, [second, entry.title]),
        targetSharedId: ingredientEntities[second].entity.sharedId,
        relationTypeId: idOf(citedIn),
      });
    }
    await saveTextRef({
      sourceSharedId: entry.entity.sharedId,
      sourceFileId: fileId,
      snippet: pickSnippet(extract, [entry.row.chef, entry.row.chef.split(' ').pop(), entry.title]),
      targetSharedId: chefEntities[entry.row.chef].entity.sharedId,
      relationTypeId: idOf(citedIn),
    });
  }

  log(
    `created ${INGREDIENTS.length} ingredients, ${CHEFS.length} chefs, ${RESTAURANTS.length} restaurants, ${RECIPES.length} recipes`
  );

  const ctx = {
    ingredientTpl,
    chefTpl,
    restaurantTpl,
    recipeTpl,
    cuisine,
    diet,
    season,
    course,
    nationality,
    ingredientEntities,
    chefEntities,
    restaurantEntities,
    recipeEntities,
  };
  await ensureSpanish(ctx);
  await ensureCookbookPage(ctx);
  log('done');
}

main()
  .catch(error => {
    console.error('[kitchen] FAILED', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (pdfBrowser) await pdfBrowser.close();
  });
