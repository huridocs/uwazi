/* eslint-disable max-statements */
import request from 'supertest';
import { Application } from 'express';
import { ObjectId } from 'mongodb';
import { setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { suggestionsRoutes } from 'api/suggestions/routes';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { factory, fixtures, suggestionSharedId6Title } from 'api/suggestions/specs/fixtures';

// Mock IX external service to avoid Redis/task manager initialization via routes import
jest.mock('api/services/informationextraction/InformationExtraction', () => ({
  InformationExtraction: class IXMock {
    status = jest.fn().mockResolvedValue({ status: 'ready' });

    trainModel = jest.fn().mockResolvedValue({ status: 'processing' });

    testModel = jest.fn().mockResolvedValue({ status: 'processing' });
  },
}));

describe('POST /api/suggestions/training-set', () => {
  const app: Application = setUpApp(suggestionsRoutes, (req, _res, next) => {
    req.user = { username: 'admin', role: 'admin' };
    next();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
    testingEnvironment.unsetFakeContext();
    jest.restoreAllMocks();
  });

  it('should validate input (missing extractorId)', async () => {
    const response = await request(app).post('/api/suggestions/training-set').send({});
    expect(response.status).toBe(422);
    expect(response.body.error).toContain('You should provide an Extractor');
  });

  it('should validate suggestionIds must be a non-empty array of strings', async () => {
    const extractorId = factory.id('title_extractor').toString();
    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send({ extractorId, suggestionIds: 'not-an-array' })
      .expect(422);
    expect(response.body.error).toContain('You should provide at least one Suggestion');

    const response2 = await request(app)
      .post('/api/suggestions/training-set')
      .send({ extractorId, suggestionIds: [] })
      .expect(422);
    expect(response2.body.error).toContain('You should provide at least one Suggestion');
  });

  it('should mark suggestions as useForTraining (idempotent, scoped by extractorId)', async () => {
    const extractorId = factory.id('title_extractor').toString();
    const suggestionId = suggestionSharedId6Title.toString();

    const body = {
      extractorId,
      suggestionIds: [suggestionId],
      useForTraining: true,
    };

    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send(body)
      .expect(200);

    expect(response.body).toEqual({ updated: [suggestionId], useForTraining: true });

    const suggestion = await testingEnvironment.db
      .getCollection('ixsuggestions')!
      .findOne({ _id: new ObjectId(suggestionId) });
    expect(suggestion?.useForTraining).toBe(true);

    // idempotent call
    const response2 = await request(app)
      .post('/api/suggestions/training-set')
      .send(body)
      .expect(200);
    expect(response2.body).toEqual({ updated: [suggestionId], useForTraining: true });
  });

  it('should unmark suggestions when useForTraining is false', async () => {
    const extractorId = factory.id('title_extractor').toString();
    const suggestionId = suggestionSharedId6Title.toString();

    const body = {
      extractorId,
      suggestionIds: [suggestionId],
      useForTraining: false,
    };

    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send(body)
      .expect(200);

    expect(response.body).toEqual({ updated: [suggestionId], useForTraining: false });

    const suggestion = await testingEnvironment.db
      .getCollection('ixsuggestions')!
      .findOne({ _id: new ObjectId(suggestionId) });
    expect(suggestion?.useForTraining).toBeFalsy();
  });

  it('should ignore suggestionIds not belonging to the extractor', async () => {
    const wrongExtractorId = factory.id('another_extractor').toString();
    const suggestionId = suggestionSharedId6Title.toString();

    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send({ extractorId: wrongExtractorId, suggestionIds: [suggestionId], useForTraining: true })
      .expect(200);

    // updated is empty as id does not belong to extractor
    expect(response.body).toEqual({ updated: [], useForTraining: true });
  });

  it('should default useForTraining to true if omitted', async () => {
    const extractorId = factory.id('title_extractor').toString();
    const suggestionId = suggestionSharedId6Title.toString();

    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send({ extractorId, suggestionIds: [suggestionId] })
      .expect(200);

    expect(response.body).toEqual({ updated: [suggestionId], useForTraining: true });
  });

  it('should support bulk marking across multiple suggestions', async () => {
    const extractorId = factory.id('title_extractor').toString();
    const sampled = await IXSuggestionsModel.db
      .find({ extractorId: factory.id('title_extractor') })
      .limit(2);
    const ids = sampled.map((doc: any) => doc._id!.toString());

    const response = await request(app)
      .post('/api/suggestions/training-set')
      .send({ extractorId, suggestionIds: ids, useForTraining: true })
      .expect(200);

    expect(response.body).toEqual({ updated: ids, useForTraining: true });

    const collection = testingEnvironment.db.getCollection('ixsuggestions')!;
    const suggestions = await collection
      .find({ _id: { $in: ids.map(i => new ObjectId(i)) } })
      .project({ _id: 1, useForTraining: 1 })
      .toArray();
    const mapById = new Map(suggestions.map((s: any) => [s._id.toString(), s.useForTraining]));
    ids.forEach(id => expect(mapById.get(id)).toBe(true));
  });
});
