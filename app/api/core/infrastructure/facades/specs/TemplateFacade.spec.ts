import { ObjectId } from 'mongodb';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { LanguageISO6391, PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateFacade } from '../TemplateFacade.js';

const titleProperty: PropertySchema = {
  name: 'title',
  label: 'Title',
  type: 'text',
  isCommonProperty: true,
};

const template = (name: string): TemplateDBO => ({
  _id: new ObjectId(),
  name,
  properties: [],
  commonProperties: [titleProperty],
});

const mockTemplatesDao = (templates: TemplateDBO[]) => {
  jest.spyOn(TemplatesDAOFactory, 'default').mockReturnValue(
    TestUtils.mockClass<MongoTemplatesDAO>({
      get: async () => templates,
    })
  );
};

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
};

const stubUpdateWithGate = (firstTemplateName: string) => {
  const firstGate = deferred();
  const firstStarted = deferred();
  let secondStarted = false;
  const update = jest.spyOn(TemplateFacade, 'update').mockImplementation(async dto => {
    if (dto.name === firstTemplateName) {
      firstStarted.resolve();
      await firstGate.promise;
    } else {
      secondStarted = true;
    }
    return {
      _id: dto._id,
      name: dto.name,
      color: '',
      default: false,
      commonProperties: dto.commonProperties,
      properties: dto.properties,
      processing: dto.processing,
      entityViewPage: dto.entityViewPage ?? '',
    };
  });
  return { update, firstGate, firstStarted, getSecondStarted: () => secondStarted };
};

const applyWhileHoldingFirstUpdate = async (
  templates: TemplateDBO[],
  language: LanguageISO6391
) => {
  mockTemplatesDao(templates);
  const run = stubUpdateWithGate(templates[0].name);
  const pending = TemplateFacade.applyNewNameGeneration(language);
  await run.firstStarted.promise;
  const startedSecondWhileFirstInFlight = run.getSecondStarted();
  run.firstGate.resolve();
  await pending;
  return {
    update: run.update,
    startedSecondWhileFirstInFlight,
    secondStarted: run.getSecondStarted(),
  };
};

describe('TemplateFacade.applyNewNameGeneration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should update every template sequentially with reindex false and the default language', async () => {
    const templates = [template('A'), template('B')];
    const result = await applyWhileHoldingFirstUpdate(templates, 'es');

    expect(result.startedSecondWhileFirstInFlight).toBe(false);
    expect(result.update).toHaveBeenNthCalledWith(1, { ...templates[0], reindex: false }, 'es');
    expect(result.update).toHaveBeenNthCalledWith(2, { ...templates[1], reindex: false }, 'es');
    expect(result.secondStarted).toBe(true);
  });

  it('should not update templates when none exist', async () => {
    mockTemplatesDao([]);
    const update = jest.spyOn(TemplateFacade, 'update');

    await TemplateFacade.applyNewNameGeneration('en');

    expect(update).not.toHaveBeenCalled();
  });
});
