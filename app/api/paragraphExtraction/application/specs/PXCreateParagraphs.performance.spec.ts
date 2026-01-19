/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';

import { createMockLogger } from 'api/core/libs/logger/infrastructure/MockLogger';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { MongoPXExtractorDBO } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from 'api/paragraphExtraction/infrastructure/MongoPXExtractorsDataSource';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { mongoPXEntitiesStatusCollection } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from 'api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO';
import { PXCreateParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory';

import { PXCreateParagraphsInput } from '../PXCreateParagraphs';

const factory = getFixturesFactory();

// Reuse same fixtures as main test file
const sourceRelationshipType = {
  _id: factory.id('sourceRelationshipType'),
  name: 'Source Relationship Type',
  properties: [],
};

const targetRelationshipType = {
  _id: factory.id('targetRelationshipType'),
  name: 'Target Relationship Type',
  properties: [],
};

const paragraphProperty = factory.property('extracted_paragraph', 'markdown', {
  label: 'Extracted Paragraph',
});

const paragraphNumberProperty = factory.property('paragraph_number_property', 'numeric', {
  label: 'Paragraph number',
});

const textProperty = factory.property('text_property', 'text');
const template = factory.template('default template');
const sourceTemplate = factory.template('Source Template');

const relationshipProperty = factory.property('paragraph_to_source_entity', 'relationship', {
  content: sourceTemplate._id.toString(),
  relationType: sourceRelationshipType._id.toString(),
});

const targetTemplate = factory.template('Target Template', [
  paragraphProperty,
  paragraphNumberProperty,
  textProperty,
  relationshipProperty,
]);

const entityEn = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  {
    title: 'Source Entity English',
  }
);

const entityEs = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  {
    language: 'es',
    title: 'Source Entity Spanish',
  }
);

const entityPt = factory.entity(
  'Source Entity',
  sourceTemplate.name,
  {},
  {
    language: 'pt',
    title: 'Source Entity Portuguese',
  }
);

const extractor: MongoPXExtractorDBO = {
  _id: factory.id('extractor'),
  sourceTemplateId: sourceTemplate._id,
  targetTemplateId: targetTemplate._id,
  paragraphNumberPropertyId: paragraphNumberProperty._id as ObjectId,
  paragraphPropertyId: paragraphProperty._id as ObjectId,
  sourceRelationshipTypeId: sourceRelationshipType._id,
  targetRelationshipTypeId: targetRelationshipType._id,
};

const mongoEntityStatus: MongoPXEntityStatusDBO = {
  _id: factory.id('entity_status'),
  extractorId: extractor._id,
  entitySharedId: entityEn.sharedId!,
  status: EntityStatus.Processing,
};

const createFixtures = (): DBFixture => ({
  relationtypes: [sourceRelationshipType, targetRelationshipType],
  [mongoPXExtractorsCollection]: [extractor],
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus],
  templates: [sourceTemplate, targetTemplate, template],
  entities: [entityEn, entityEs, entityPt],
  settings: [
    {
      languages: [
        { label: 'English', key: 'en' },
        { label: 'Portuguese', key: 'pt' },
        { label: 'Spanish', key: 'es', default: true },
      ],
    },
  ],
});

const setUpUseCase = () => {
  const createParagraphs = PXCreateParagraphsFactory.createDefault();
  (createParagraphs.createParagraphsBatch as any).dependencies.logger = createMockLogger();
  return { createParagraphs };
};

type ParagraphOutput = PXCreateParagraphsInput['paragraphs'][0];

const generateParagraphs = (count: number): ParagraphOutput[] => {
  return Array.from({ length: count }, (_, i) => ({
    paragraphNumber: i + 1,
    translations: [
      {
        isMainLanguage: false,
        language: 'en',
        needsUserReview: false,
        text: `Paragraph ${i + 1} in english with some content that simulates real text`,
      },
      {
        isMainLanguage: true,
        language: 'es',
        needsUserReview: false,
        text: `Paragraph ${i + 1} in spanish with some content that simulates real text`,
      },
      {
        isMainLanguage: false,
        language: 'pt',
        needsUserReview: false,
        text: `Paragraph ${i + 1} in portuguese with some content that simulates real text`,
      },
    ],
  }));
};

interface PerformanceMetrics {
  totalTime: number;
  avgTimePerParagraph: number;
  paragraphCount: number;
}

const formatMetrics = (label: string, metrics: PerformanceMetrics): string => {
  return `
┌─────────────────────────────────────────────────────────────┐
│  Performance Test: ${label.padEnd(41)} │
├─────────────────────────────────────────────────────────────┤
│  Paragraphs:           ${String(metrics.paragraphCount).padStart(6)}                           │
│  Total Time:           ${metrics.totalTime.toFixed(2).padStart(10)} ms                    │
│  Avg Time/Paragraph:   ${metrics.avgTimePerParagraph.toFixed(2).padStart(10)} ms                    │
└─────────────────────────────────────────────────────────────┘
  `.trim();
};

describe('PXCreateParagraphs - Performance Tests', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures(), true);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const runPerformanceTest = async (paragraphCount: number): Promise<PerformanceMetrics> => {
    const { createParagraphs } = setUpUseCase();
    const paragraphs = generateParagraphs(paragraphCount);

    const input: PXCreateParagraphsInput = {
      entityStatusId: mongoEntityStatus._id.toString(),
      userId: new ObjectId().toString(),
      paragraphs,
    };

    const startTime = performance.now();
    await createParagraphs.execute(input);
    const endTime = performance.now();

    const totalTime = endTime - startTime;

    return {
      totalTime,
      avgTimePerParagraph: totalTime / paragraphCount,
      paragraphCount,
    };
  };

  it('Baseline: 2 paragraphs', async () => {
    const metrics = await runPerformanceTest(2);
    console.log(formatMetrics('2 paragraphs (baseline)', metrics));

    // Basic sanity check - should complete in reasonable time
    expect(metrics.totalTime).toBeLessThan(10000); // 10 seconds max
  });

  it('Realistic: 10 paragraphs', async () => {
    const metrics = await runPerformanceTest(10);
    console.log(formatMetrics('10 paragraphs (realistic)', metrics));

    expect(metrics.totalTime).toBeLessThan(30000); // 30 seconds max
  });

  it('Stress: 50 paragraphs', async () => {
    const metrics = await runPerformanceTest(50);
    console.log(formatMetrics('50 paragraphs (stress test)', metrics));

    expect(metrics.totalTime).toBeLessThan(120000); // 2 minutes max
  });

  it('Large: 500 paragraphs (production-like)', async () => {
    const metrics = await runPerformanceTest(500);
    console.log(formatMetrics('500 paragraphs (production-like)', metrics));

    expect(metrics.totalTime).toBeLessThan(600000); // 10 minutes max
  }, 600000); // 10 minute timeout

  xit('Extra Large: 1000 paragraphs (extreme)', async () => {
    const metrics = await runPerformanceTest(1000);
    console.log(formatMetrics('1000 paragraphs (extreme)', metrics));

    expect(metrics.totalTime).toBeLessThan(1200000); // 20 minutes max
  }, 1200000); // 20 minute timeout

  it('Comparison: Show scaling across different sizes', async () => {
    const sizes = [2, 5, 10, 20];
    const results: PerformanceMetrics[] = [];

    for (const size of sizes) {
      const metrics = await runPerformanceTest(size);
      results.push(metrics);
      console.log(formatMetrics(`${size} paragraphs`, metrics));
    }

    // Check if scaling is roughly linear
    const first = results[0];
    const last = results[results.length - 1];

    const expectedRatio = last.paragraphCount / first.paragraphCount;
    const actualRatio = last.totalTime / first.totalTime;

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  Scaling Analysis                                           │
├─────────────────────────────────────────────────────────────┤
│  Expected scaling ratio:  ${expectedRatio.toFixed(2).padStart(6)}x (linear)                │
│  Actual scaling ratio:    ${actualRatio.toFixed(2).padStart(6)}x                           │
│  Performance:             ${actualRatio <= expectedRatio * 1.5 ? 'GOOD ✓' : 'POOR ✗'}                            │
└─────────────────────────────────────────────────────────────┘
    `);

    // Allow up to 50% overhead beyond linear scaling
    expect(actualRatio).toBeLessThan(expectedRatio * 1.5);
  });
});
