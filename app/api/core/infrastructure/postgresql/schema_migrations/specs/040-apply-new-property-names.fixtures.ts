const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

const country = { label: 'País', name: 'pa_s', type: 'text' };
const short = { label: 'Pa', name: 'pa', type: 'text' };
const place = { label: 'Ubicación', name: 'ubicaci_n_geolocation', type: 'geolocation' };
const title = { label: 'Title', name: 'title', type: 'text' };

const entityRow = (row: { tenantId: string; id: string; template: string; metadata: unknown }) => ({
  _id: row.id,
  tenant_id: row.tenantId,
  sharedId: row.id,
  language: 'en',
  title: row.id,
  template: row.template,
  published: false,
  creationDate: 1,
  editDate: 1,
  metadata: row.metadata,
});

const fileRow = (tenantId: string, entity: string, names: string[]) => ({
  _id: `file-${entity}`,
  tenant_id: tenantId,
  originalname: `${entity}.pdf`,
  filename: `${entity}.pdf`,
  mimetype: 'application/pdf',
  type: 'document',
  entity,
  propertySelections: names.map(name => ({ name })),
});

const settingsRow = (tenantId: string, extra: Record<string, unknown> = {}) => ({
  _id: `settings-${tenantId}`,
  tenant_id: tenantId,
  links: [
    { title: 'Library', type: 'link', url: '/en/library/?q=(pa_s:1)' },
    { title: 'Group', type: 'group', sublinks: [{ title: 'Sub', url: '/library/?q=(pa_s%3A2)' }] },
  ],
  site_preferences: { home_page: '/library/?q=(filters:(pa_s:3))' },
  ...extra,
});

const suggestionRow = (row: {
  tenantId: string;
  id: string;
  template: string;
  propertyName: string;
}) => ({
  _id: row.id,
  tenant_id: row.tenantId,
  extractorId: `ext-${row.tenantId}`,
  entityId: `entity-${row.tenantId}`,
  entityTemplate: row.template,
  propertyName: row.propertyName,
  language: 'en',
  suggestedValue: [],
});

const renameFixtures = () => ({
  settings: [settingsRow(TENANT_A), settingsRow(TENANT_B)],
  templates: [
    {
      _id: 'tpl-a',
      tenant_id: TENANT_A,
      name: 'A',
      properties: [country, short, place],
      commonProperties: [title],
    },
    {
      _id: 'tpl-b',
      tenant_id: TENANT_B,
      name: 'B',
      properties: [{ label: 'pa_s', name: 'pa_s', type: 'text' }],
      commonProperties: [title],
    },
  ],
  entities: [
    entityRow({
      tenantId: TENANT_A,
      id: 'entity-a',
      template: 'tpl-a',
      metadata: { pa_s: [{ value: 'a' }], pa: [{ value: 'b' }] },
    }),
    entityRow({
      tenantId: TENANT_B,
      id: 'entity-b',
      template: 'tpl-b',
      metadata: { pa_s: [{ value: 'stay' }] },
    }),
  ],
  files: [
    fileRow(TENANT_A, 'entity-a', ['pa_s', 'title']),
    fileRow(TENANT_B, 'entity-b', ['pa_s']),
  ],
  pages: [
    { _id: 'page-a', tenant_id: TENANT_A, shared_id: 'page-a' },
    { _id: 'page-b', tenant_id: TENANT_B, shared_id: 'page-b' },
  ],
  page_locales: [
    {
      page_id: 'page-a',
      language: 'en',
      tenant_id: TENANT_A,
      title: 'Home',
      draft_content: '/library/?q=(pa_s:1,pa:2,pa_sx:3)',
      draft_script: 'property="pa_s" filterProperty="pa_s"',
    },
  ],
  page_releases: [
    {
      _id: 'rel-a',
      tenant_id: TENANT_A,
      page_id: 'page-a',
      version: 1,
      release_message: '',
      date: 1,
      locales: {
        en: {
          title: 'Home',
          draft: { content: '{list}(pa_s:5)', script: "property='pa_s'", css: '' },
        },
      },
    },
  ],
  ix_extractors: [
    {
      _id: 'ext-tenant-a',
      tenant_id: TENANT_A,
      name: 'country',
      property: 'pa_s',
      source: { property: 'ubicaci_n_geolocation' },
      templates: ['tpl-a'],
    },
    {
      _id: 'ext-tenant-b',
      tenant_id: TENANT_B,
      name: 'country',
      property: 'pa_s',
      source: { pdf: true },
      templates: ['tpl-b'],
    },
  ],
  ix_suggestions: [
    suggestionRow({ tenantId: TENANT_A, id: 'sug-a', template: 'tpl-a', propertyName: 'pa_s' }),
    suggestionRow({ tenantId: TENANT_B, id: 'sug-b', template: 'tpl-b', propertyName: 'pa_s' }),
  ],
});

export { TENANT_A, TENANT_B, country, renameFixtures, settingsRow };
