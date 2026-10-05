/**
 * @jest-environment node
 */
import type { Property, Template } from '#app/apiResponseTypes.js';
import { selectionEditFields } from '../selectionEditFields.js';

const property = (name: string, type: string, extra: Partial<Property> = {}): Property =>
  ({ _id: name, name, label: name, type, ...extra }) as Property;

const template = (id: string, properties: Property[]): Template =>
  ({ _id: id, name: id, properties }) as Template;

describe('selectionEditFields', () => {
  const summary = property('summary', 'text', { label: 'Summary' });
  const amount = property('amount', 'numeric', { label: 'Amount' });
  const title = property('title', 'text', { label: 'Title' });

  it('returns every property of the shared template except the title', () => {
    const fields = selectionEditFields(
      [template('case', [title, summary, amount])],
      ['case', 'case']
    );

    expect(fields.templateId).toBe('case');
    expect(fields.templateOnly).toBe(false);
    expect(fields.properties.map(item => item.name)).toEqual(['summary', 'amount']);
  });

  it('returns only properties that match across different templates', () => {
    const fields = selectionEditFields(
      [
        template('case', [summary, amount]),
        template('country', [property('summary', 'text', { label: 'Summary' })]),
      ],
      ['case', 'country']
    );

    expect(fields.templateId).toBe('');
    expect(fields.templateOnly).toBe(false);
    expect(fields.properties.map(item => item.name)).toEqual(['summary']);
  });

  it('is template-only when no property matches', () => {
    const fields = selectionEditFields(
      [template('case', [summary]), template('country', [amount])],
      ['case', 'country']
    );

    expect(fields).toMatchObject({ templateId: '', properties: [], templateOnly: true });
  });

  it('marks a shared property required when any template requires it', () => {
    const fields = selectionEditFields(
      [
        template('case', [property('summary', 'text', { required: false })]),
        template('report', [property('summary', 'text', { required: true })]),
      ],
      ['case', 'report']
    );

    expect(fields.properties[0].required).toBe(true);
  });

  it('loads the chosen template properties after a template change', () => {
    const fields = selectionEditFields(
      [template('case', [summary]), template('country', [amount])],
      ['case', 'country'],
      'country'
    );

    expect(fields.templateOnly).toBe(false);
    expect(fields.templateId).toBe('country');
    expect(fields.properties.map(item => item.name)).toEqual(['amount']);
  });
});
