import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresTemplateMapper } from '../PostgresTemplateMapper.js';

const factory = getFixturesFactory();

const createDomainTemplate = (name: string, properties: any[] = []) =>
  MongoTemplateMapper.toDomain(factory.template(name, properties) as any);

describe('PostgresTemplateMapper', () => {
  it('should round-trip a template preserving ids and properties', () => {
    const template = createDomainTemplate('testTemplate', [
      factory.property('text1', 'text'),
      factory.property('date1', 'date'),
    ]);

    const dbo = PostgresTemplateMapper.toDBO(template);
    const roundTripped = PostgresTemplateMapper.toDomain(dbo);

    expect(roundTripped.id).toBe(template.id);
    expect(roundTripped.name).toBe('testTemplate');
    expect(roundTripped.properties).toHaveLength(2);
    expect(roundTripped.properties[0].name).toBe('text1');
    expect(roundTripped.properties[1].name).toBe('date1');
    expect(roundTripped.commonProperties).toHaveLength(3);
  });

  it('should preserve processing state', () => {
    const template = createDomainTemplate('processingTemplate', []);
    template.processing = { active: true, totalJobs: 10, completedJobs: 5 };

    const dbo = PostgresTemplateMapper.toDBO(template);

    expect(dbo.processing).toEqual({ active: true, totalJobs: 10, completedJobs: 5 });

    const roundTripped = PostgresTemplateMapper.toDomain(dbo);
    expect(roundTripped.processing).toEqual({ active: true, totalJobs: 10, completedJobs: 5 });
  });

  it('should convert ObjectId property ids to strings in DBO', () => {
    const template = createDomainTemplate('idTemplate', [factory.property('text1', 'text')]);

    const dbo = PostgresTemplateMapper.toDBO(template);

    expect(typeof dbo._id).toBe('string');
    dbo.properties.forEach(p => {
      expect(typeof p._id).toBe('string');
    });
    dbo.commonProperties.forEach(p => {
      expect(typeof p._id).toBe('string');
    });
  });
});
