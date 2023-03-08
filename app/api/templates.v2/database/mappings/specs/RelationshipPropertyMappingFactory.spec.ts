import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { partialImplementation } from 'api/common.v2/testing/partialImplementation';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property } from 'api/templates.v2/model/Property';
import { propertyMappings } from 'database/elastic_mapping/mappings';
import { RelationshipPropertyMappingFactory } from '../RelationshipPropertyMappingFactory';

describe('when creating mappings for denormalied properties', () => {
  const getAllPropertiesMock = jest
    .fn()
    .mockResolvedValue([
      new Property('date', 'prop1', 'prop1', 'template1'),
      new Property('numeric', 'prop2', 'prop2', 'template2'),
    ]);
  const templatesDataSourceMock = partialImplementation<TemplatesDataSource>({
    getAllProperties: () =>
      partialImplementation<ResultSet<Property>>({
        all: getAllPropertiesMock,
      }),
  });
  const propertiesMappingsMock = partialImplementation<typeof propertyMappings>({
    date: jest.fn().mockImplementation(() => 'date mapping'),
    numeric: jest.fn().mockImplementation(() => 'numeric mapping'),
    select: jest.fn().mockImplementation(() => 'select mapping'),
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should cache the properties requested', async () => {
    const factory = new RelationshipPropertyMappingFactory(
      templatesDataSourceMock,
      propertiesMappingsMock
    );

    await factory.create({ denormalizedProperty: 'prop1' });
    await factory.create({ denormalizedProperty: 'prop2' });

    expect(getAllPropertiesMock).toHaveBeenCalledTimes(1);
  });

  it('should return the mapping for the denormalized property', async () => {
    const factory = new RelationshipPropertyMappingFactory(
      templatesDataSourceMock,
      propertiesMappingsMock
    );

    expect(await factory.create({ denormalizedProperty: 'prop1' })).toBe('date mapping');
    expect(await factory.create({ denormalizedProperty: 'prop2' })).toBe('numeric mapping');
  });

  it('should assume title and return a text mapping if not denormalizedProperty provided', async () => {
    const factory = new RelationshipPropertyMappingFactory(
      templatesDataSourceMock,
      propertiesMappingsMock
    );

    expect(await factory.create({})).toBe('select mapping');
  });
});
