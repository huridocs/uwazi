import { ObjectId } from 'mongodb';
import { DBFixture } from '#api/utils/testing_db.js';

const templateId = new ObjectId();
const otherTemplateId = new ObjectId();
const entityId = new ObjectId();
const otherEntityId = new ObjectId();
const extractorId = new ObjectId();
const titleExtractorId = new ObjectId();
const pageId = new ObjectId();
const releaseId = new ObjectId();

const country = {
  label: 'País',
  name: 'pa_s',
  type: 'text',
};

const short = {
  label: 'Pa',
  name: 'pa',
  type: 'text',
};

const place = {
  label: 'Ubicación',
  name: 'ubicaci_n_geolocation',
  type: 'geolocation',
};

const keptTitle = {
  label: 'Title',
  name: 'title',
  type: 'text',
};

const template = (id: ObjectId, properties: Record<string, unknown>[]) => ({
  _id: id,
  name: id.toString(),
  properties,
  commonProperties: [keptTitle],
});

const entity = (doc: {
  id: ObjectId;
  templateRef: ObjectId;
  sharedId: string;
  metadata: unknown;
}) => ({
  _id: doc.id,
  sharedId: doc.sharedId,
  language: 'en',
  title: doc.sharedId,
  template: doc.templateRef,
  metadata: doc.metadata,
});

const baseCollections = (): DBFixture => ({
  templates: [
    template(templateId, [country, short, place]),
    template(otherTemplateId, [{ label: 'pa_s', name: 'pa_s', type: 'text' }]),
  ],
  entities: [
    entity({
      id: entityId,
      templateRef: templateId,
      sharedId: 'entity-1',
      metadata: { pa_s: [{ value: 'a' }], pa: [{ value: 'b' }] },
    }),
    entity({
      id: otherEntityId,
      templateRef: otherTemplateId,
      sharedId: 'entity-2',
      metadata: { pa_s: [{ value: 'stay' }] },
    }),
  ],
  files: [
    {
      _id: new ObjectId(),
      entity: 'entity-1',
      propertySelections: [{ name: 'pa_s' }, { name: 'title' }],
    },
    {
      _id: new ObjectId(),
      entity: 'entity-2',
      propertySelections: [{ name: 'pa_s' }],
    },
  ],
  ixextractors: [
    {
      _id: extractorId,
      name: 'country',
      property: 'pa_s',
      source: { property: 'ubicaci_n_geolocation' },
      templates: [templateId],
    },
    {
      _id: titleExtractorId,
      name: 'title',
      property: 'title',
      source: { pdf: true },
      templates: [templateId],
    },
  ],
  ixsuggestions: [
    {
      _id: new ObjectId(),
      propertyName: 'pa_s',
      entityTemplate: templateId.toString(),
    },
    {
      _id: new ObjectId(),
      propertyName: 'title',
      entityTemplate: templateId.toString(),
    },
    {
      _id: new ObjectId(),
      propertyName: 'pa_s',
      entityTemplate: otherTemplateId.toString(),
    },
  ],
  settings: [
    {
      links: [
        { title: 'Library', type: 'link', url: '/en/library/?q=(pa_s:1)' },
        {
          title: 'Group',
          type: 'group',
          sublinks: [{ title: 'Sub', url: '/library/?q=(pa_s%3A2)' }],
        },
      ],
      home_page: '/library/?q=(filters:(pa_s:3))',
    },
  ],
  pages: [
    {
      _id: pageId,
      locales: {
        en: {
          title: 'Home',
          draft: {
            content: '/library/?q=(pa_s:1,pa:2,pa_sx:3)',
            script: 'property="pa_s" filterProperty="pa_s"',
          },
        },
      },
      draft: { content: '{list}(pa_s:4)', script: 'untouched pa_s' },
      metadata: { content: '/library/?q=(sort:pa_s)', script: '' },
    },
  ],
  page_releases: [
    {
      _id: releaseId,
      page: pageId,
      version: 1,
      release_message: '',
      date: 1,
      en: { title: 'Home', content: '{list}(pa_s:5)', script: "property='pa_s'" },
    },
  ],
});

const renameFixture = (): DBFixture => baseCollections();

const alreadyNewFixture = (): DBFixture => ({
  ...baseCollections(),
  settings: [{ newNameGeneration: true, links: [], home_page: '' }],
});

const alreadyEqualFixture = (): DBFixture => ({
  settings: [{}],
  templates: [template(templateId, [{ label: 'Pais', name: 'pais', type: 'text' }])],
  entities: [
    entity({
      id: entityId,
      templateRef: templateId,
      sharedId: 'entity-1',
      metadata: { pais: [{ value: 'a' }] },
    }),
  ],
});

const collisionFixture = (): DBFixture => ({
  settings: [{}],
  templates: [
    template(templateId, [
      { label: 'A/B', name: 'a_b', type: 'text' },
      { label: 'A B', name: 'a_b_2', type: 'text' },
    ]),
  ],
});

const disagreeFixture = (): DBFixture => ({
  settings: [{}],
  templates: [
    template(templateId, [country]),
    template(otherTemplateId, [{ label: 'Paìs', name: 'pa_s', type: 'text' }]),
  ],
  ixextractors: [
    {
      _id: extractorId,
      name: 'country',
      property: 'pa_s',
      source: { pdf: true },
      templates: [templateId, otherTemplateId],
    },
  ],
});

export {
  alreadyEqualFixture,
  alreadyNewFixture,
  collisionFixture,
  disagreeFixture,
  otherTemplateId,
  renameFixture,
  templateId,
};
