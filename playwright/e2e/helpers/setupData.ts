import { APIRequestContext, expect, Page } from '@playwright/test';
import { readFile } from 'fs/promises';
import path from 'path';

type ThesaurusRow = { id?: string; label: string };

type TemplateProperty = {
  name: string;
  label: string;
  type: string;
  content?: string;
  relationType?: string;
};

let cachedCommonProperties: any[] | null = null;

const pdfRoot = '/home/konz/Sites/pdf-test/pdfs';

const heroes = [
  { name: 'Midnight Guardian', docSet: 1, power: 'Stealth', side: 'The Good Ones' },
  { name: 'Solaris', docSet: 2, power: 'Light', side: 'The Good Ones' },
  { name: 'Iron Mind', docSet: 3, power: 'Intelligence', side: 'The Good Ones' },
  { name: 'Shadow Runner', docSet: 4, power: 'Speed', side: 'The Bad Ones' },
  { name: 'Aqua Sentinel', docSet: 5, power: 'Water control', side: 'The Bad Ones' },
] as const;

const languages = [
  { key: 'en', code3: 'eng', suffix: 'english' },
  { key: 'es', code3: 'spa', suffix: 'spanish' },
  { key: 'ar', code3: 'arb', suffix: 'arabic' },
] as const;

async function apiOk(
  response: Awaited<ReturnType<APIRequestContext['post']>>,
  operation: string = 'request'
) {
  const body = await response.text();
  expect(
    response.ok(),
    `Expected OK response for ${operation}. Status=${response.status()} Body=${body}`
  ).toBeTruthy();
  return body;
}

const ajaxHeaders = {
  'X-Requested-With': 'XMLHttpRequest',
};

export async function setLanguageInUI(page: Page, languageLabel: string, localeKey: string) {
  void page;
  void languageLabel;
  void localeKey;
}

export async function configureLanguages(request: APIRequestContext) {
  const addLanguagesResponse = await request.post('/api/translations/languages', {
    headers: ajaxHeaders,
    data: [
      {
        key: 'es',
        label: 'Spanish',
        ISO639_3: 'spa',
        ISO639_1: 'es',
        elastic: 'spanish',
        localized_label: 'Espanol',
        translationAvailable: true,
      },
      {
        key: 'ar',
        label: 'Arabic',
        rtl: true,
        ISO639_3: 'arb',
        ISO639_1: 'ar',
        elastic: 'arabic',
        localized_label: 'العربية',
        translationAvailable: true,
      },
    ],
  });

  expect(addLanguagesResponse.ok()).toBeTruthy();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const settingsResponse = await request.get('/api/settings', { headers: ajaxHeaders });
    const settingsBody = await settingsResponse.json();
    const languageKeys = (settingsBody.languages || []).map((language: any) => language.key);

    if (languageKeys.includes('en') && languageKeys.includes('es') && languageKeys.includes('ar')) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('configureLanguages timeout: expected en/es/ar in settings.languages');
}

export async function createThesaurus(request: APIRequestContext) {
  const payload = {
    name: 'Super powers',
    values: [
      { id: 'stealth', label: 'Stealth' },
      { id: 'light', label: 'Light' },
      { id: 'intelligence', label: 'Intelligence' },
      { id: 'speed', label: 'Speed' },
      { id: 'water_control', label: 'Water control' },
    ] as ThesaurusRow[],
  };

  const response = await request.post('/api/thesauris', {
    headers: ajaxHeaders,
    data: payload,
  });
  const body = await apiOk(response, 'createThesaurus');
  return JSON.parse(body);
}

export async function createRelationType(request: APIRequestContext) {
  const response = await request.post('/api/relationtypes', {
    headers: ajaxHeaders,
    data: { name: 'belongs to organization' },
  });
  const body = await apiOk(response, 'createRelationType');
  return JSON.parse(body);
}

export async function createTemplate(
  request: APIRequestContext,
  name: string,
  properties: TemplateProperty[],
  options?: { default?: boolean }
) {
  if (!cachedCommonProperties) {
    const templatesResponse = await request.get('/api/templates', { headers: ajaxHeaders });
    const templatesBody = await templatesResponse.json();
    const rows = templatesBody?.rows || templatesBody || [];
    cachedCommonProperties =
      rows.find((t: any) => Array.isArray(t.commonProperties) && t.commonProperties.length > 0)
        ?.commonProperties || [];
  }

  const response = await request.post('/api/templates', {
    headers: ajaxHeaders,
    data: {
      name,
      default: options?.default || false,
      commonProperties: cachedCommonProperties,
      properties,
    },
  });
  const body = await apiOk(response, `createTemplate:${name}`);
  return JSON.parse(body);
}

export async function createEntity(
  request: APIRequestContext,
  entity: {
    title: string;
    template: string;
    sharedId?: string;
    language: string;
    metadata?: Record<string, unknown>;
    published?: boolean;
  }
) {
  const response = await request.post('/api/entities', {
    headers: ajaxHeaders,
    data: {
      ...entity,
      published: entity.published ?? true,
    },
  });
  const body = await apiOk(response, `createEntity:${entity.sharedId || entity.title}:${entity.language}`);
  return JSON.parse(body);
}

export async function uploadHeroDocuments(
  page: Page,
  request: APIRequestContext,
  heroSharedId: string,
  docSet: number
) {
  const uploadEndpoint = '/api/files/upload/document';

  for (const language of languages) {
    await setLanguageInUI(
      page,
      language.key === 'en' ? 'English' : language.key === 'es' ? 'Español' : 'العربية',
      language.key
    );
    const pdfPath = path.join(pdfRoot, `doc_${docSet}_${language.suffix}.pdf`);
    const response = await request.post(uploadEndpoint, {
      headers: { ...ajaxHeaders, 'Accept-Language': language.key },
      multipart: {
        entity: heroSharedId,
        file: {
          name: `doc_${docSet}_${language.suffix}.pdf`,
          mimeType: 'application/pdf',
          buffer: await readFile(pdfPath),
        } as any,
      },
    });
    await apiOk(response, `uploadDocument:${heroSharedId}:${language.key}`);
  }
}

export async function setupBootstrapDataset(page: Page) {
  const request = page.request;

  await configureLanguages(request);

  const thesaurus = await createThesaurus(request);
  const relationType = await createRelationType(request);

  const organizationsTemplate = await createTemplate(
    request,
    'Organizations',
    [{ name: 'description', label: 'Description', type: 'text' }],
    { default: false }
  );

  const heroesTemplate = await createTemplate(
    request,
    'Heroes',
    [
      { name: 'bio', label: 'Bio', type: 'text' },
      {
        name: 'superPowers',
        label: 'Super powers',
        type: 'multiselect',
        content: thesaurus._id?.toString?.() || thesaurus._id,
      },
      {
        name: 'organization',
        label: 'Organization',
        type: 'relationship',
        content: organizationsTemplate._id?.toString?.() || organizationsTemplate._id,
        relationType: relationType._id?.toString?.() || relationType._id,
      },
    ],
    { default: true }
  );

  const heroesTemplateProperties = heroesTemplate.properties || [];
  const propNameByLabel = (label: string, fallback: string) =>
    heroesTemplateProperties.find((p: any) => p.label === label)?.name || fallback;
  const bioProp = propNameByLabel('Bio', 'bio');
  const powersProp = propNameByLabel('Super powers', 'super_powers');
  const orgProp = propNameByLabel('Organization', 'organization');
  const powersByLabel: Record<string, string> = Object.fromEntries(
    (thesaurus.values || []).map((value: any) => [value.label, value.id])
  );

  const goodOrg = await createEntity(request, {
    title: 'The Good Ones',
    template: organizationsTemplate._id?.toString?.() || organizationsTemplate._id,
    language: 'en',
    metadata: { description: [{ value: 'Heroic organizations' }] },
  });

  const badOrg = await createEntity(request, {
    title: 'The Bad Ones',
    template: organizationsTemplate._id?.toString?.() || organizationsTemplate._id,
    language: 'en',
    metadata: { description: [{ value: 'Villain organizations' }] },
  });

  const orgBySide: Record<string, string> = {
    'The Good Ones': goodOrg.sharedId,
    'The Bad Ones': badOrg.sharedId,
  };

  const createdHeroes: { sharedId: string; name: string; docSet: number }[] = [];

  for (const hero of heroes) {
    const createdEn = await createEntity(request, {
      title: hero.name,
      template: heroesTemplate._id?.toString?.() || heroesTemplate._id,
      language: 'en',
      metadata: {
        [bioProp]: [{ value: `${hero.name} biography in en` }],
        [powersProp]: [{ value: powersByLabel[hero.power] }],
        [orgProp]: [{ value: orgBySide[hero.side] }],
      },
    });

    const sharedId = createdEn.sharedId;

    createdHeroes.push({ sharedId, name: hero.name, docSet: hero.docSet });
  }

  for (const hero of createdHeroes) {
    await uploadHeroDocuments(page, request, hero.sharedId, hero.docSet);
  }

  // If setup calls above completed without throwing, dataset bootstrap is considered successful.
}
