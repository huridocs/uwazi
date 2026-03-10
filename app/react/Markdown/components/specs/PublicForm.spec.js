/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import Immutable from 'immutable';
import { act } from 'react-dom/test-utils';
import { LocalForm } from 'app/Forms/Form';
import Dropzone from 'react-dropzone';
import { MetadataFormFields } from 'app/Metadata';
import { Captcha } from 'app/ReactReduxForms';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { PublicFormComponent as PublicForm } from '../PublicForm';

const mockApiGet = jest.fn().mockResolvedValue({
  json: {
    data: [
      { title: 'Southern Nights', documents: [], attachments: [] },
      { title: 'elenore', documents: [{ originalName: 'The Turtles' }], attachments: [] },
    ],
  },
});
jest.mock('app/utils/api', () => ({
  ...jest.requireActual('app/utils/api'),
  __esModule: true,
  default: { get: () => mockApiGet() },
  get: () => mockApiGet(),
}));

describe('PublicForm', () => {
  let props;
  let component;
  let instance;
  let submit;
  let request;
  const mockedRevokeObjectURL = jest.fn();

  beforeEach(() => {
    URL.revokeObjectURL = mockedRevokeObjectURL;
    request = Promise.resolve({ promise: Promise.resolve('ok') });
    submit = jasmine.createSpy('submit').and.callFake(async () => request);
  });

  afterAll(() => {
    mockedRevokeObjectURL.mockReset();
  });

  const prepareMocks = () => {
    instance = component.instance();
    instance.refreshCaptcha = jest.fn();
    instance.formDispatch = jest.fn();
    component.find(LocalForm).props().getDispatch(instance.formDispatch);
    const captcha = component.find(Captcha);
    captcha.props().refresh = instance.refreshCaptcha;
    captcha.props().refresh(instance.refreshCaptcha);
  };

  const render = (customProps, generatedId = false) => {
    props = {
      template: Immutable.fromJS({
        _id: '123',
        commonProperties: [
          {
            label: 'Title changed',
            name: 'title',
            generatedId,
          },
        ],
        properties: [
          { type: 'text', name: 'text', label: 'Text' },
          { type: 'image', name: 'image', label: 'Image' },
        ],
      }),
      thesauris: Immutable.fromJS([]),
      file: false,
      attachments: false,
      submit,
      remote: false,
      reloadThesauri: jasmine.createSpy('reloadThesauri'),
    };
    const state = {
      entityView: {
        entity: Immutable.fromJS({
          sharedId: 'entity1',
          templatedId: 'template1',
          title: 'Entity 1',
          attachments: [],
          metadata: [{ text: [] }],
        }),
        entityForm: { attachments: [] },
      },
      settings: { collection: Immutable.fromJS({ dateFormat: 'dateFormat' }) },
      templates: Immutable.fromJS([
        {
          name: 'template1',
          _id: 'templateId',
          properties: [],
          commonProperties: [{ name: 'title', label: 'Title' }],
        },
      ]),
    };
    const mappedProps = { ...props, ...customProps };
    component = renderConnectedMount(PublicForm, state, mappedProps, true);
    prepareMocks();
  };

  it('should bind the MetadataFormFields change to this form', () => {
    render();
    const metadataFormFields = component.find(MetadataFormFields);
    metadataFormFields.props().boundChange('publicForm.title', 'New Title');

    expect(instance.formDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'New Title', model: 'publicForm.title' })
    );
  });

  it('should render a generated ID as title if the option is marked', () => {
    render({}, true);
    const title = component.find('#title').at(0);
    expect(title.props().defaultValue).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
  });

  it('should load a generated Id as title after submit if the option is marked', async () => {
    render({}, true);
    const title = component.find('#title').at(0);
    expect(title.props().defaultValue).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));

    const formSubmit = component.find(LocalForm).props().onSubmit;
    await act(async () => {
      await formSubmit({ title: 'test' });
    });

    component.update();
    const title1 = component.find('#title').at(0);
    expect(title1.props().defaultValue).toEqual(expect.stringMatching(/^[a-zA-Z0-9-]{12}$/));
    expect(title1).not.toEqual(title);
  });

  it('should enable remote captcha', () => {
    render({ remote: true });

    expect(component.find(Captcha).props()).toMatchObject({
      model: '.captcha',
      refresh: expect.any(Function),
      remote: true,
    });
  });

  it('should render a form with file and attachments', () => {
    render({ file: true, attachments: true });
    const formSubmit = component.find(LocalForm);
    expect(formSubmit.length).toBe(1);
    expect(component.find(Dropzone).length).toBe(2);
  });

  it('should submit the values wrapped', async () => {
    render();

    const formSubmit = component.find(LocalForm).props().onSubmit;
    await formSubmit({ title: 'test', metadata: { color: 'red', size: 42, date: 13442423 } });

    expect(props.submit).toHaveBeenCalledWith(
      {
        file: undefined,
        metadata: { color: [{ value: 'red' }], date: [{ value: 13442423 }], size: [{ value: 42 }] },
        template: '123',
        title: 'test',
        attachments: [],
      },
      false
    );
  });

  it('should refresh the captcha and clear the form after submit', async () => {
    render();
    const formSubmit = component.find(LocalForm).props().onSubmit;
    await formSubmit({
      title: 'test',
      metadata: { image: { data: 'blob:http://localhost:3000/blob/file_id' } },
    });
    expect(mockedRevokeObjectURL).toHaveBeenCalledWith('blob:http://localhost:3000/blob/file_id');
    expect(instance.refreshCaptcha).toHaveBeenCalled();
    expect(instance.formDispatch).toHaveBeenCalledWith({
      model: 'publicform',
      type: 'rrf/reset',
    });
  });

  it('should refresh captcha and NOT clear the form on submission error', async () => {
    request = new Promise(resolve => {
      resolve({ promise: Promise.reject() });
    });
    submit = jasmine.createSpy('submit').and.returnValue(request);
    render();
    const formSubmit = component.find(LocalForm).props().onSubmit;
    await formSubmit({ title: 'test' });

    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise
        .then(() => fail('should throw error'))
        .catch(() => {
          expect(instance.formDispatch).not.toHaveBeenCalledWith();
          expect(instance.refreshCaptcha).toHaveBeenCalled();
        });
    });
  });

  it('should NOT clear the form attachments on submission error', async done => {
    const newFile = new File([Buffer.from('image').toString('base64')], 'image.jpg', {
      type: 'image/jpg',
    });

    render({ attachments: true });

    const attachments = component.find('.preview-title');
    expect(attachments.length).toEqual(0);
    const formSubmit = component.find(LocalForm).props().onSubmit;
    await act(async () => {
      await component.find(Dropzone).props().onDrop([newFile]);
      component.update();
    });
    request = new Promise(resolve => {
      resolve({ promise: Promise.reject() });
    });
    submit = jasmine.createSpy('submit').and.returnValue(request);
    await act(async () => {
      await formSubmit({ title: 'test' });
      component.update();
    });
    request.then(uploadCompletePromise => {
      uploadCompletePromise.promise
        .then(() => fail('should throw error'))
        .catch(() => {
          const actualAttachments = component.find('.preview-title');
          expect(actualAttachments.length).toBe(1);
          expect(actualAttachments.get(0).props.children).toEqual('image.jpg');
          expect(instance.formDispatch).not.toHaveBeenCalledWith();
          expect(instance.refreshCaptcha).toHaveBeenCalled();
          done();
        });
    });
  });
});
