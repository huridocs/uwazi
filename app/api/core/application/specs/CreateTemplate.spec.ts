import { CreateTemplateUseCase } from '../CreateTemplate';

const createSut = () => {
  const sut = new CreateTemplateUseCase();

  return { sut };
};

describe('CreateTemplateUseCase', () => {
  it('should create Template correctly', async () => {
    const { sut } = createSut();

    await sut.execute({
      name: 'Template Name',
      properties: [],
      commonProperties: [{ label: 'title', type: 'text' }],
    });
  });
});
