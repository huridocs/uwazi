/**
 * @jest-environment node
 */
import { buildMultipleUpdateBody } from '../buildMultipleUpdateBody.js';

const base = {
  ids: ['a', 'b'],
  activeLanguage: 'en',
  languages: ['en', 'es', 'pt'],
  properties: [
    { name: 'summary', type: 'text' },
    { name: 'amount', type: 'numeric' },
  ],
  metadata: {},
  translations: {},
  templateId: 'case',
  initialTemplateId: 'case',
};

describe('buildMultipleUpdateBody', () => {
  it('sends the active language in metadata and the other filled languages in translations', () => {
    const body = buildMultipleUpdateBody({
      ...base,
      metadata: {
        summary: [{ value: 'Hello' }],
        amount: [{ value: 3 }],
      },
      translations: {
        es: { summary: [{ value: 'Hola' }] },
        pt: { summary: [{ value: '' }] },
      },
    });

    expect(body).toEqual({
      ids: ['a', 'b'],
      values: {
        metadata: {
          summary: [{ value: 'Hello' }],
          amount: [{ value: 3 }],
        },
        translations: {
          es: { summary: [{ value: 'Hola' }] },
        },
      },
    });
  });

  it('omits a text property that was not filled in any language', () => {
    const body = buildMultipleUpdateBody({
      ...base,
      metadata: { amount: [{ value: 3 }] },
      translations: { es: { summary: [{ value: '' }] } },
    });

    expect(body?.values.metadata).toEqual({ amount: [{ value: 3 }] });
    expect(body?.values.translations).toBeUndefined();
  });

  it('sends the template only when it changed', () => {
    expect(buildMultipleUpdateBody({ ...base, templateId: 'country' })?.values.template).toBe(
      'country'
    );
    expect(buildMultipleUpdateBody(base)).toBeUndefined();
  });
});
