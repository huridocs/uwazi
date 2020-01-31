/** @format */
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';

import { ThesauriList } from '../ThesauriList';

describe('ThesaurisList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      deleteThesaurus: jasmine.createSpy('deleteThesaurus').and.returnValue(Promise.resolve()),
      disableClassification: jasmine
        .createSpy('disableClassification')
        .and.returnValue(Promise.resolve()),
      enableClassification: jasmine
        .createSpy('enableClassification')
        .and.returnValue(Promise.resolve()),
      checkThesaurusCanBeClassified: jasmine
        .createSpy('checkThesaurusCanBeClassified')
        .and.returnValue(Promise.resolve()),
      checkThesaurusCanBeDeleted: jasmine
        .createSpy('checkThesaurusCanBeDeleted')
        .and.returnValue(Promise.resolve()),
      dictionaries: Immutable.fromJS([
        {
          _id: 'thesaurusUnderscoreId1',
          name: 'Continents',
          model_available: false,
          values: [
            {
              _id: 'valueUnderscoreId1',
              label: 'Africa',
              id: 'valueId1',
            },
            {
              _id: 'valueUnderscoreId2',
              label: 'Asia',
              id: 'valueId2',
            },
            {
              _id: 'valueUnderscoreId3',
              label: 'North America',
              id: 'valueId3',
            },
            {
              _id: 'valueUnderscoreId4',
              label: 'South America',
              id: 'valueId4',
            },
            {
              _id: 'valueUnderscoreId5',
              label: 'Oceania',
              id: 'valueId5',
            },
            {
              _id: 'valueUnderscoreId6',
              label: 'Europe',
              id: 'valueId6',
            },
          ],
        },
        {
          _id: 'thesaurusUnderscoreId2',
          name: 'Issues',
          model_available: true,
          enable_classification: true,
          suggestions: 3,
          values: [
            {
              _id: 'valueUnderscoreId1',
              label: 'Detention',
              id: 'valueId1',
            },
            {
              _id: 'valueUnderscoreId2',
              label: 'Elections',
              id: 'valueId2',
            },
            {
              _id: 'valueUnderscoreId3',
              label: 'Freedom of Movement',
              id: 'valueId3',
            },
          ],
        },
      ]),
    };

    context = {
      confirm: jasmine.createSpy('confirm'),
    };
  });

  const render = () => {
    component = shallow(<ThesauriList {...props} />, { context });
  };

  describe('render', () => {
    it('should match the snapshot', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render suggestions nodes when suggestions exist', () => {
      render();
      const renderedContexts = component.find('table');
      expect(renderedContexts.length).toBe(1);
      expect(renderedContexts.find({ scope: 'row' }).length).toBe(2);
      expect(renderedContexts.find('.thesauri-list').find('.vertical-line').length).toBe(1);
      expect(
        renderedContexts
          .find('td')
          .find('.thesauri-list')
          .find('.vertical-line')
          .containsMatchingElement(<span>View Suggestions</span>)
      ).toBeTruthy();
      expect(
        renderedContexts
          .find('.thesaurus-suggestion-count')
          .contains(
            <span className="thesaurus-suggestion-count">{3}&nbsp;documents to be reviewed</span>
          )
      ).toBeTruthy();
    });
  });

  describe('classification', () => {
    it('should validate the classifier model before enabling', done => {
      render();
      component
        .instance()
        .enableClassification({ _id: 'thesaurusUnderscoreId2', name: 'Issues' })
        .then(() => {
          expect(props.checkThesaurusCanBeClassified).toHaveBeenCalled();
          done();
        });
      component.instance().enableClassification({});
    });

    it('should confirm  before deleting the thesaurus', done => {
      render();
      component
        .instance()
        .deleteThesaurus({ _id: 'thesaurusUnderscoreId2', name: 'Issues' })
        .then(() => {
          expect(context.confirm).toHaveBeenCalled();
          expect(props.checkThesaurusCanBeDeleted).toHaveBeenCalled();
          done();
        });
      component.instance().enableClassification({});
    });
  });
});
