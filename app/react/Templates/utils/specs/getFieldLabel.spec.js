import Immutable from 'immutable';
import { t } from 'app/I18N';
import getFieldLabel from '../getFieldLabel';

describe('getFieldLabel', () => {
  let template;
  let field;
  beforeEach(() => {
    template = {
      _id: 'tpl1',
      commonProperties: [
        { name: 'creationDate', label: 'Date added' },
        { name: 'title', label: 'Name' },
      ],
      properties: [
        {
          name: 'prop1',
          label: 'Prop 1',
        },
        {
          name: 'prop2',
          label: 'Prop 2',
        },
      ],
    };
    field = 'metadata.prop2';
  });
  function runGetLabel() {
    return getFieldLabel(field, template);
  }

  describe('if field has a metadata. prefix', () => {
    it('should return translated metadata field', () => {
      expect(runGetLabel()).toEqual(t(template._id, 'Prop 2'));
    });
  });

  describe('when field is title', () => {
    it('should return translated title label', () => {
      field = 'title';
      expect(runGetLabel()).toEqual(t(template._id, 'Name'));
    });
    describe('when template is not defined', () => {
      it('should return the input field', () => {
        template = undefined;
        field = 'title';
        expect(runGetLabel()).toEqual('title');
      });
    });
  });

  describe('when field is not in template', () => {
    it('should return the input field', () => {
      field = 'metadata.nonexistent';
      expect(runGetLabel()).toEqual('metadata.nonexistent');
      field = 'nonexistent';
      expect(runGetLabel()).toEqual('nonexistent');
    });
  });

  describe('when template is not defined', () => {
    it('should return the input field', () => {
      template = undefined;
      expect(runGetLabel()).toEqual('metadata.prop2');
    });
  });

  it('should work when template is an Immutable instance', () => {
    template = Immutable.fromJS(template);
    field = 'title';
    expect(runGetLabel()).toEqual('Name');
    field = 'metadata.prop1';
    expect(runGetLabel()).toEqual('Prop 1');
    field = 'nonexistent';
    expect(runGetLabel()).toEqual('nonexistent');
  });
});
