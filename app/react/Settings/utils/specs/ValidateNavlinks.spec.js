import validator from '../ValidateNavlinks.js';

describe('Navlinks Validator', () => {
  let validationRules;
  let form;

  beforeEach(() => {
    const links = [1, 2, 3, 4, 5, 6];
    form = {
      links: [
        {title: ''},
        {title: 'goodTitle'},
        {title: '  '},
        {title: '0'},
        {}
      ]
    };
    validationRules = validator(links);
  });

  it('should index each link validator', () => {
    expect(Object.keys(validationRules['']).length).toBe(6);
    expect(validationRules['']['links.0.title.required']).toBeDefined();
    expect(validationRules['']['links.1.title.required']).toBeDefined();
  });

  it('should validate that title is not empty', () => {
    expect(validationRules['']['links.0.title.required'](form)).toBe(false);
    expect(validationRules['']['links.1.title.required'](form)).toBe(true);
    expect(validationRules['']['links.2.title.required'](form)).toBe(false);
    expect(validationRules['']['links.3.title.required'](form)).toBe(true);
    expect(validationRules['']['links.4.title.required'](form)).toBe(false);
  });

  it('should pass validation if index not in form', () => {
    expect(validationRules['']['links.5.title.required'](form)).toBe(true);
  });
});
