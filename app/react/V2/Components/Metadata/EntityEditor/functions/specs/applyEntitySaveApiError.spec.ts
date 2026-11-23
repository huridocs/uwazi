import { ApiError } from '#shared/apiClient/index.js';
import type { FormMetadataProperty } from '../formatMetadataForForm.js';
import { applyEntitySaveApiError, beginEntitySave } from '../applyEntitySaveApiError.js';

describe('applyEntitySaveApiError', () => {
  const properties: FormMetadataProperty[] = [
    { _id: '10', type: 'link', name: 'link', label: 'Link' },
  ];

  it('maps field validations and keeps the banner clear', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const error = new ApiError('Validation failed', {
      kind: 'http',
      status: 400,
      detail:
        '[{"instancePath":"/0/value/url","message":"Link Property value must be a valid URL."}]',
      validations: [
        { instancePath: '/0/value/url', message: 'Link Property value must be a valid URL.' },
      ],
    });

    applyEntitySaveApiError({ error, setEditErrors, setSaveError, metadataProperties: properties });

    expect(setEditErrors).toHaveBeenCalledWith({
      metadata: { link: 'Invalid URL' },
    });
    expect(setSaveError).not.toHaveBeenCalled();
  });

  it('uses a handled message for general errors instead of validation dumps', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const error = new ApiError('Validation failed', {
      kind: 'http',
      status: 400,
      detail: '[{"instancePath":"/metadata","message":"Required"}]\n/metadata: Required',
    });

    applyEntitySaveApiError({ error, setEditErrors, setSaveError, metadataProperties: properties });

    expect(setEditErrors).toHaveBeenCalledWith(undefined);
    expect(setSaveError).toHaveBeenCalledWith('Validation failed');
  });

  it('shows the banner when several links share an unnamed url path', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const twoLinks: FormMetadataProperty[] = [
      { _id: '10', type: 'link', name: 'site', label: 'Site' },
      { _id: '11', type: 'link', name: 'archive', label: 'Archive' },
    ];
    const error = new ApiError('Validation failed', {
      kind: 'http',
      status: 400,
      detail:
        '[{"instancePath":"/0/value/url","message":"Link Property value must be a valid URL."}]',
      validations: [
        { instancePath: '/0/value/url', message: 'Link Property value must be a valid URL.' },
      ],
    });

    applyEntitySaveApiError({
      error,
      setEditErrors,
      setSaveError,
      metadataProperties: twoLinks,
    });

    expect(setEditErrors).toHaveBeenCalledWith(undefined);
    expect(setSaveError).toHaveBeenCalledWith('Validation failed');
  });

  it('keeps the banner when a mapped field is joined by an unmapped validation', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const fields: FormMetadataProperty[] = [
      { _id: '1', type: 'text', name: 'titleNote', label: 'Note' },
      { _id: '10', type: 'link', name: 'site', label: 'Site' },
      { _id: '11', type: 'link', name: 'archive', label: 'Archive' },
    ];
    const error = new ApiError('Validation failed', {
      kind: 'http',
      status: 400,
      detail:
        '[{"instancePath":"/0/value/url","message":"Link Property value must be a valid URL."}]',
      validations: [
        { instancePath: '/metadata/titleNote', message: 'Text Property is required' },
        { instancePath: '/0/value/url', message: 'Link Property value must be a valid URL.' },
      ],
    });

    applyEntitySaveApiError({
      error,
      setEditErrors,
      setSaveError,
      metadataProperties: fields,
    });

    expect(setEditErrors).toHaveBeenCalledWith({
      metadata: { titleNote: 'This field is required' },
    });
    expect(setSaveError).toHaveBeenCalledWith('Validation failed');
  });

  it('clears the form errors when a save starts', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const clearErrors = jest.fn();

    beginEntitySave({ setEditErrors, setSaveError, clearErrors });

    expect(setSaveError).toHaveBeenCalledWith(undefined);
    expect(setEditErrors).toHaveBeenCalledWith(undefined);
    expect(clearErrors).toHaveBeenCalledWith();
  });

  it('uses a handled banner when every message is a validation dump', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();
    const dump = '[{"instancePath":"/metadata","message":"Required"}]';
    const error = new ApiError(dump, {
      kind: 'http',
      status: 400,
      title: dump,
      detail: dump,
    });

    applyEntitySaveApiError({ error, setEditErrors, setSaveError, metadataProperties: properties });

    expect(setSaveError).toHaveBeenCalledWith('Validation failed');
  });

  it('ignores cancelled errors', () => {
    const setEditErrors = jest.fn();
    const setSaveError = jest.fn();

    applyEntitySaveApiError({
      error: new ApiError('Cancelled', { kind: 'cancelled', status: 0 }),
      setEditErrors,
      setSaveError,
      metadataProperties: properties,
    });

    expect(setEditErrors).not.toHaveBeenCalled();
    expect(setSaveError).not.toHaveBeenCalled();
  });
});
