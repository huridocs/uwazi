import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { MongoEntityMapper } from '#api/core/infrastructure/mongodb/entity/MongoEntityMapper.js';
import { PostgresEntityMapper } from '../PostgresEntityMapper.js';

const factory = getFixturesFactory();

describe('PostgresEntityMapper', () => {
  const templateDbo = factory.template('sample_template', [
    factory.property('date', 'date'),
    factory.property('numeric', 'numeric'),
    factory.property('select', 'select', { content: 'thesaurus' }),
    factory.property('text', 'text'),
    factory.relationshipProp('relationship'),
  ]);

  const metadata = {
    date: [{ value: 1000000 }],
    numeric: [{ value: 42 }],
    select: [{ value: 'option1', label: 'Option 1' }],
    text: [{ value: 'Some text content' }],
    relationship: [
      {
        value: 'shared_id',
        type: 'entity',
        label: 'Related Entity',
        icon: { _id: 'related_icon_id', label: 'Related Icon', type: 'icon' },
        inheritedType: 'text',
        inheritedValue: [{ value: 'Some text' }],
      },
    ],
  };

  const fullProps = {
    creationDate: 1000000,
    editDate: 2000000,
    icon: { _id: 'icon_id', label: 'Icon Label', type: 'icon' },
    user: factory.id('user_id'),
    generatedToc: true,
    preview: 'thumbnail.jpg',
  };

  const createDomainEntity = (props: Record<string, unknown> = fullProps) => {
    const entitiesDBO = factory.entityInMultipleLanguages(
      ['en', 'es'],
      'sample_entity',
      'sample_template',
      metadata,
      props
    );
    return MongoEntityMapper.toDomain(entitiesDBO as any[], templateDbo as any);
  };

  describe('toDBO', () => {
    it('maps one row per translation with string ids', () => {
      const entity = createDomainEntity();
      const rows = PostgresEntityMapper.toDBO(entity);

      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.language)).toEqual(['en', 'es']);
      expect(rows.map(r => r.sharedId)).toEqual(['sample_entity', 'sample_entity']);
      expect(rows.map(r => r.template)).toEqual([
        templateDbo._id.toHexString(),
        templateDbo._id.toHexString(),
      ]);
      expect(rows.map(r => r._id)).toEqual([
        factory.id('sample_entity-en').toHexString(),
        factory.id('sample_entity-es').toHexString(),
      ]);
      expect(rows.map(r => r.user)).toEqual([
        factory.id('user_id').toHexString(),
        factory.id('user_id').toHexString(),
      ]);
    });

    it('maps title, dates, generatedToc, icon and preview', () => {
      const entity = createDomainEntity();
      const [en] = PostgresEntityMapper.toDBO(entity);

      expect(en.title).toBe('sample_entity');
      expect(en.creationDate).toBe(1000000);
      expect(en.editDate).toBe(2000000);
      expect(en.generatedToc).toBe(true);
      expect(en.icon).toEqual({ _id: 'icon_id', label: 'Icon Label', type: 'icon' });
      expect(en.preview).toBe('thumbnail.jpg');
    });

    it('maps relationship metadata icon.id to icon._id', () => {
      const entity = createDomainEntity();
      const [en] = PostgresEntityMapper.toDBO(entity);

      expect(en.metadata.relationship).toEqual([
        {
          value: 'shared_id',
          type: 'entity',
          label: 'Related Entity',
          icon: { _id: 'related_icon_id', label: 'Related Icon', type: 'icon' },
          inheritedType: 'text',
          inheritedValue: [{ value: 'Some text' }],
        },
      ]);
    });

    it('passes non-relationship metadata through unchanged', () => {
      const entity = createDomainEntity();
      const [en] = PostgresEntityMapper.toDBO(entity);

      expect(en.metadata.date).toEqual([{ value: 1000000 }]);
      expect(en.metadata.numeric).toEqual([{ value: 42 }]);
      expect(en.metadata.select).toEqual([{ value: 'option1', label: 'Option 1' }]);
      expect(en.metadata.text).toEqual([{ value: 'Some text content' }]);
    });

    it('omits published and permissions', () => {
      const entity = createDomainEntity();
      const rows = PostgresEntityMapper.toDBO(entity);

      rows.forEach(row => {
        expect(row.published).toBeUndefined();
        expect(row.permissions).toBeUndefined();
      });
    });

    it('defaults icon, user, generatedToc and preview to null when absent', () => {
      const entity = createDomainEntity({ creationDate: 1000000, editDate: 2000000 });
      const [en] = PostgresEntityMapper.toDBO(entity);

      expect(en.icon).toEqual({ _id: null, type: 'Empty' });
      expect(en.user).toBeNull();
      expect(en.generatedToc).toBeNull();
      expect(en.preview).toBeNull();
    });
  });

  describe('toEntityDBO', () => {
    it('converts string ids to ObjectIds', () => {
      const entity = createDomainEntity();
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO(row);

      expect(dbo._id).toEqual(factory.id('sample_entity-en'));
      expect(dbo.template).toEqual(templateDbo._id);
      expect(dbo.user).toEqual(factory.id('user_id'));
    });

    it('converts null user, generatedToc and preview to undefined', () => {
      const entity = createDomainEntity({ creationDate: 1000000, editDate: 2000000 });
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO(row);

      expect(dbo.user).toBeUndefined();
      expect(dbo.generatedToc).toBeUndefined();
      expect(dbo.preview).toBeUndefined();
    });

    it('passes icon through and sets obsoleteMetadata: []', () => {
      const entity = createDomainEntity();
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO(row);

      expect(dbo.icon).toEqual({ _id: 'icon_id', label: 'Icon Label', type: 'icon' });
      expect(dbo.obsoleteMetadata).toEqual([]);
    });

    it('passes through the default empty icon', () => {
      const entity = createDomainEntity({ creationDate: 1000000, editDate: 2000000 });
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO(row);

      expect(dbo.icon).toEqual({ _id: null, type: 'Empty' });
    });

    it('defaults published to false when omitted, and passes through metadata, title, language, sharedId and dates', () => {
      const entity = createDomainEntity();
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO(row);

      expect(dbo.published).toBe(false);
      expect(dbo.permissions).toBeUndefined();
      expect(dbo.metadata).toEqual(row.metadata);
      expect(dbo.title).toBe('sample_entity');
      expect(dbo.language).toBe('en');
      expect(dbo.sharedId).toBe('sample_entity');
      expect(dbo.creationDate).toBe(1000000);
      expect(dbo.editDate).toBe(2000000);
    });

    it('passes through published when present', () => {
      const entity = createDomainEntity();
      const [row] = PostgresEntityMapper.toDBO(entity);
      const dbo = PostgresEntityMapper.toEntityDBO({ ...row, published: true });

      expect(dbo.published).toBe(true);
    });
  });

  describe('round-trip', () => {
    it('Entity → toDBO → toEntityDBO → MongoEntityMapper.toDomain preserves the entity', () => {
      const entity = createDomainEntity();
      const rows = PostgresEntityMapper.toDBO(entity);
      const dbos = rows.map(PostgresEntityMapper.toEntityDBO);
      const result = MongoEntityMapper.toDomain(dbos, templateDbo as any);

      expect(result.sharedId).toBe(entity.sharedId);
      expect(result.userId).toBe(entity.userId);
      expect(result.generatedToc).toBe(entity.generatedToc);
      expect(result.icon).toEqual(entity.icon);
      expect(result.translations).toEqual(entity.translations);
    });
  });
});
