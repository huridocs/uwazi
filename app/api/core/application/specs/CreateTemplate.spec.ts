import { TestUtils } from 'api/common.v2/utils/Test';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { CreateTemplateUseCase } from '../CreateTemplate';

const createSut = () => {
  const templatesDS = TestUtils.mockClass<TemplatesDataSource>({ create: jest.fn() });

  const sut = new CreateTemplateUseCase({ templatesDS });

  return { sut, templatesDS };
};

describe('CreateTemplateUseCase', () => {
  it('should create a Template', async () => {
    const { sut, templatesDS } = createSut();

    await sut.execute({
      name: 'Template Name',
      properties: [{ label: 'Text', type: 'text' }],
      commonProperties: [
        { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
        { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
        { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
      ],
      color: '#142134',
    });

    expect(templatesDS.create).toHaveBeenCalledWith({
      id: 'id',
      name: 'Template Name',
      color: '#142134',
      commonProperties: [
        {
          id: 'id',
          label: 'Title',
          name: { value: 'title' },
          template: 'To be removed',
          type: 'text',
          generatedId: false,
          isCommonProperty: true,
          prioritySorting: false,
          required: false,
          noLabel: false,
          showInCard: false,
        },
        {
          id: 'id',
          label: 'Creation Date',
          name: { value: 'creationDate' },
          template: 'To be removed',
          type: 'date',
          isCommonProperty: true,
          prioritySorting: false,
          required: false,
          noLabel: false,
          showInCard: false,
        },
        {
          id: 'id',
          label: 'Edit Date',
          name: { value: 'editDate' },
          template: 'To be removed',
          type: 'date',
          isCommonProperty: true,
          prioritySorting: false,
          required: false,
          noLabel: false,
          showInCard: false,
        },
      ],
      properties: [
        {
          id: 'id',
          label: 'Text',
          name: { value: 'text' },
          template: 'To be removed',
          type: 'text',
          defaultfilter: false,
          filter: false,
          generatedId: false,
          noLabel: false,
          prioritySorting: false,
          required: false,
          showInCard: false,
        },
      ],
    });
  });
});
