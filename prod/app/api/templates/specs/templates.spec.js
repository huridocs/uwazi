"use strict";

var _jasmineHelpers = require("../../utils/jasmineHelpers");
var _testing_db = _interopRequireDefault(require("../../utils/testing_db"));
var _documents = _interopRequireDefault(require("../../documents/documents.js"));
var _entities = _interopRequireDefault(require("../../entities/entities.js"));
var _templates = _interopRequireDefault(require("../templates.js"));
var _translations = _interopRequireDefault(require("../../i18n/translations"));

var _fixtures = _interopRequireWildcard(require("./fixtures.js"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /* eslint-disable max-nested-callbacks */ /* eslint-disable max-statements */


describe('templates', () => {
  beforeEach(done => {
    spyOn(_translations.default, 'addContext').and.returnValue(Promise.resolve());
    _testing_db.default.clearAllAndLoad(_fixtures.default).then(done).catch((0, _jasmineHelpers.catchErrors)(done));
  });

  afterAll(done => {
    _testing_db.default.disconnect().then(done);
  });

  describe('save', () => {
    it('should return the saved template', done => {
      const newTemplate = { name: 'created_template', commonProperties: [{ name: 'title', label: 'Title' }], properties: [{ label: 'fieldLabel' }] };

      _templates.default.save(newTemplate).
      then(template => {
        expect(template._id).toBeDefined();
        expect(template.name).toBe('created_template');
        done();
      }).
      catch(done.fail);
    });

    it('should create a template', done => {
      const newTemplate = { name: 'created_template', properties: [{ label: 'fieldLabel' }], commonProperties: [{ name: 'title', label: 'Title' }] };

      _templates.default.save(newTemplate).
      then(() => _templates.default.get()).
      then(allTemplates => {
        const newDoc = allTemplates.find(template => template.name === 'created_template');

        expect(newDoc.name).toBe('created_template');
        expect(newDoc.properties[0].label).toEqual('fieldLabel');
        done();
      }).
      catch(done.fail);
    });

    describe('when property content changes', () => {
      it('should remove the values from the entities and update them', done => {
        spyOn(_translations.default, 'updateContext');
        spyOn(_entities.default, 'removeValuesFromEntities');
        spyOn(_entities.default, 'updateMetadataProperties').and.returnValue(Promise.resolve());
        const changedTemplate = {
          _id: _fixtures.templateWithContents,
          name: 'changed',
          commonProperties: [{ name: 'title', label: 'Title' }],
          properties:
          [{ id: '1', type: 'select', content: 'new_thesauri', label: 'select' },
          { id: '2', type: 'multiselect', content: 'new_thesauri', label: 'multiselect' }] };


        _templates.default.save(changedTemplate).
        then(() => {
          expect(_entities.default.removeValuesFromEntities).toHaveBeenCalledWith({ select: '', multiselect: [] }, _fixtures.templateWithContents);
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });
    });

    it('should validate properties not having repeated names and return an error', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { label: 'label 1' },
        { label: 'label 1' },
        { label: 'Label 2' },
        { label: 'label 2' },
        { label: 'label 3' }] };



      _templates.default.save(newTemplate).
      then(() => done.fail('properties have repeated names, should have failed with an error')).
      catch(error => {
        expect(error).toEqual({ code: 400, message: 'duplicated_labels: label 1, label 2' });
        done();
      });
    });

    it('should not allow changing names to existing ones (swap)', done => {
      const changedTemplate = {
        _id: _fixtures.swapTemplate,
        name: 'swap names template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { id: '1', type: 'text', name: 'text', label: 'Select' },
        { id: '2', type: 'select', name: 'select', label: 'Text' }] };



      _templates.default.save(changedTemplate).
      then(() => done.fail('properties have swaped names, should have failed with an error')).
      catch(error => {
        expect(error).toEqual({ code: 400, message: "Properties can't swap names: text" });
        done();
      });
    });

    it('should validate properties not having the same label as the title', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Name' }],
        properties: [
        { label: 'Label1' },
        { label: 'name' }] };



      _templates.default.save(newTemplate).
      then(() => done.fail('properties have conflicting label with the title, should throw error')).
      catch(err => {
        expect(err).toEqual({ code: 400, message: 'duplicated_labels: name' });
        done();
      });
    });

    it('should validate properties not having repeated relationship fields', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { _id: 1, label: 'label 1', type: 'relationship', relationType: '1', content: '1' },
        { _id: 2, label: 'label 2', type: 'relationship', relationType: '1', content: '1' },
        { _id: 3, label: 'label 3', type: 'relationship', relationType: '1', content: '2' },
        { _id: 4, label: 'label 4', type: 'relationship', relationType: '2', content: '1' },
        { _id: 5, label: 'label 5', type: 'relationship', relationType: '3', content: '1' },
        { _id: 6, label: 'label 6', type: 'relationship', relationType: '3', content: '' }] };



      _templates.default.save(newTemplate).
      then(() => done.fail('properties have repeated relationships, should have failed with an error')).
      catch(error => {
        expect(error).toEqual({ code: 400, message: 'duplicated_relationships: label 1, label 2, label 5, label 6' });
        done();
      });
    });

    it('should validate required inherited property', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { _id: 1, label: 'label 1', type: 'relationship', relationType: '1', inherit: true, content: '', inheritProperty: '' }] };



      _templates.default.save(newTemplate).
      then(() => done.fail('properties have repeated relationships, should have failed with an error')).
      catch(error => {
        expect(error).toEqual({ code: 400, message: 'required_inherited_property: label 1' });
        done();
      });
    });

    it('should add it to translations with Entity type', done => {
      const newTemplate = {
        name: 'created template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { label: 'label 1' },
        { label: 'label 2' }] };



      _templates.default.save(newTemplate).
      then(response => {
        const expectedValues = {
          'created template': 'created template',
          Title: 'Title',
          'label 1': 'label 1',
          'label 2': 'label 2' };


        expect(_translations.default.addContext).toHaveBeenCalledWith(response._id, 'created template', expectedValues, 'Entity');
        done();
      });
    });

    it('should assign a safe property name based on the label ', done => {
      const newTemplate = {
        name: 'created_template',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [
        { label: 'label 1', type: 'text' },
        { label: 'label 2', type: 'select' },
        { label: 'label 3', type: 'image' },
        { label: 'label 4', name: 'name', type: 'text' },
        { label: 'label 5', type: 'geolocation' }] };



      _templates.default.save(newTemplate).
      then(() => _templates.default.get()).
      then(allTemplates => {
        const newDoc = allTemplates.find(template => template.name === 'created_template');

        expect(newDoc.properties[0].name).toEqual('label_1');
        expect(newDoc.properties[1].name).toEqual('label_2');
        expect(newDoc.properties[2].name).toEqual('label_3');
        expect(newDoc.properties[3].name).toEqual('label_4');
        expect(newDoc.properties[4].name).toEqual('label_5_geolocation');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should set a default value of [] to properties', done => {
      const newTemplate = { name: 'created_template', commonProperties: [{ name: 'title', label: 'Title' }] };
      _templates.default.save(newTemplate).
      then(_templates.default.get).
      then(allTemplates => {
        const newDoc = allTemplates.find(template => template.name === 'created_template');

        expect(newDoc.properties).toEqual([]);
        done();
      }).
      catch(done.fail);
    });

    describe('when passing _id', () => {
      beforeEach(() => {
        spyOn(_entities.default, 'updateMetadataProperties').and.returnValue(Promise.resolve());
      });

      it('should updateMetadataProperties', done => {
        spyOn(_translations.default, 'updateContext');
        const template = {
          _id: _fixtures.templateToBeEditedId,
          name: 'template to be edited',
          commonProperties: [{ name: 'title', label: 'Title' }],
          properties: [],
          default: true };

        const toSave = {
          _id: _fixtures.templateToBeEditedId,
          commonProperties: [{ name: 'title', label: 'Title' }],
          name: 'changed name' };

        _templates.default.save(toSave, 'en').
        then(() => {
          expect(_entities.default.updateMetadataProperties).toHaveBeenCalledWith(toSave, template, 'en');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should edit an existing one', done => {
        spyOn(_translations.default, 'updateContext');
        const toSave = { _id: _fixtures.templateToBeEditedId, name: 'changed name', commonProperties: [{ name: 'title', label: 'Title' }] };
        _templates.default.save(toSave).
        then(_templates.default.get).
        then(allTemplates => {
          const edited = allTemplates.find(template => template._id.toString() === _fixtures.templateToBeEditedId.toString());
          expect(edited.name).toBe('changed name');
          done();
        }).
        catch((0, _jasmineHelpers.catchErrors)(done));
      });

      it('should update the translation context for it', done => {
        const newTemplate = {
          name: 'created template',
          commonProperties: [{ name: 'title', label: 'Title' }],
          properties: [{ label: 'label 1', type: 'text' }, { label: 'label 2', type: 'text' }] };

        spyOn(_translations.default, 'updateContext');
        _templates.default.save(newTemplate).
        then(template => {
          template.name = 'new title';
          template.properties[0].label = 'new label 1';
          template.properties.pop();
          template.properties.push({ label: 'label 3', type: 'text' });
          template.commonProperties[0].label = 'new title label';
          _translations.default.addContext.calls.reset();
          return _templates.default.save(template);
        }).
        then(response => {
          expect(_translations.default.addContext).not.toHaveBeenCalled();
          expect(_translations.default.updateContext).toHaveBeenCalledWith(
          response._id,
          'new title',
          {
            'label 1': 'new label 1',
            'created template': 'new title' },

          ['label 2'],
          { 'new label 1': 'new label 1', 'label 3': 'label 3', 'new title': 'new title', 'new title label': 'new title label' },
          'Entity');

          done();
        }).
        catch(done.fail);
      });

      it('should return the saved template', done => {
        spyOn(_translations.default, 'updateContext');
        const edited = { _id: _fixtures.templateToBeEditedId, name: 'changed name', commonProperties: [{ name: 'title', label: 'Title' }] };
        return _templates.default.save(edited).
        then(template => {
          expect(template.name).toBe('changed name');
          done();
        }).
        catch(done.fail);
      });
    });

    describe('when the template name exists', () => {
      it('should return the error', done => {
        const template = { name: 'duplicated name', commonProperties: [{ name: 'title', label: 'Title' }] };
        _templates.default.save(template).
        then(() => {
          done.fail('should return an error');
        }).
        catch(error => {
          expect(error.json).toBe('duplicated_entry');
          done();
        });
      });
    });
  });

  describe('delete', () => {
    it('should delete properties of other templates using this template as select/relationship', async () => {
      spyOn(_templates.default, 'countByTemplate').and.returnValue(Promise.resolve(0));
      await _templates.default.delete({ _id: _fixtures.templateToBeDeleted });

      const [template] = await _templates.default.get({ name: 'thesauri template 2' });
      expect(template.properties.length).toBe(1);
      expect(template.properties[0].label).toBe('select2');

      const [template2] = await _templates.default.get({ name: 'thesauri template 3' });
      expect(template2.properties.length).toBe(2);
      expect(template2.properties[0].label).toBe('text');
      expect(template2.properties[1].label).toBe('text2');
    });

    it('should delete a template when no document is using it', done => {
      spyOn(_templates.default, 'countByTemplate').and.returnValue(Promise.resolve(0));
      return _templates.default.delete({ _id: _fixtures.templateToBeDeleted }).
      then(response => {
        expect(response).toEqual({ _id: _fixtures.templateToBeDeleted });
        return _templates.default.get();
      }).
      then(allTemplates => {
        const deleted = allTemplates.find(template => template.name === 'to be deleted');
        expect(deleted).not.toBeDefined();
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should delete the template translation', done => {
      spyOn(_documents.default, 'countByTemplate').and.returnValue(Promise.resolve(0));
      spyOn(_translations.default, 'deleteContext').and.returnValue(Promise.resolve());

      return _templates.default.delete({ _id: _fixtures.templateToBeDeleted }).
      then(() => {
        expect(_translations.default.deleteContext).toHaveBeenCalledWith(_fixtures.templateToBeDeleted);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should throw an error when there is documents using it', done => {
      spyOn(_templates.default, 'countByTemplate').and.returnValue(Promise.resolve(1));
      return _templates.default.delete({ _id: _fixtures.templateToBeDeleted }).
      then(() => {
        done.fail('should not delete the template and throw an error because there is some documents associated with the template');
      }).
      catch(error => {
        expect(error.key).toEqual('documents_using_template');
        expect(error.value).toEqual(1);
        done();
      });
    });
  });

  describe('countByThesauri()', () => {
    it('should return number of templates using a thesauri', done => {
      _templates.default.countByThesauri('thesauri1').
      then(result => {
        expect(result).toBe(3);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });

    it('should return zero when none is using it', done => {
      _templates.default.countByThesauri('not_used_relation').
      then(result => {
        expect(result).toBe(0);
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });

  describe('setAsDefault()', () => {
    beforeEach(() => {
      spyOn(_translations.default, 'updateContext');
    });
    it('should set the given ID as the default template', done => {
      _templates.default.setAsDefault(_fixtures.templateWithContents.toString()).
      then(([newDefault, oldDefault]) => {
        expect(newDefault.name).toBe('content template');
        expect(oldDefault.name).toBe('template to be edited');
        done();
      }).
      catch((0, _jasmineHelpers.catchErrors)(done));
    });
  });
});