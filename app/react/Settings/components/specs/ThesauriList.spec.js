import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { ThesauriList } from '../ThesauriList';

describe('ThesaurisList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      mainContext: { confirm: jasmine.createSpy('confirm') },
      deleteThesaurus: jasmine
        .createSpy('deleteThesaurus')
        .and.callFake(async () => Promise.resolve()),
      checkThesaurusCanBeDeleted: jasmine
        .createSpy('checkThesaurusCanBeDeleted')
        .and.callFake(async () => Promise.resolve()),
      topicClassificationEnabled: true,
      dictionaries: Immutable.fromJS([
        {
          _id: 'thesaurusUnderscoreId1',
          name: 'Continents',
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
      locale: 'en',
      languages: Immutable.fromJS([
        { _id: 1, key: 'en', default: true },
        { _id: 2, key: 'es' },
      ]),
    };
  });

  const render = () => {
    component = shallow(<ThesauriList {...props} />, {
      context: { store: { getState: () => ({}) } },
    });
  };

  describe('render', () => {
    it('should match the snapshot', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should omit non-enable_classification thesauris if toggle if off', () => {
      props.topicClassificationEnabled = false;
      render();
      const renderedContexts = component.find('table');
      expect(renderedContexts.find('td').find('.vertical-line').length).toBe(1);
    });

    it('should render suggestions nodes when suggestions exist', () => {
      render();
      const renderedContexts = component.find('table');
      expect(renderedContexts.length).toBe(1);
      expect(renderedContexts.find({ scope: 'row' }).length).toBe(2);
      expect(renderedContexts.find('td').find('.thesaurus-suggestion-count').length).toBe(1);
      expect(renderedContexts.find('td').find('.vertical-line').length).toBe(2);
      expect(
        renderedContexts
          .find('td')
          .find('.vertical-line')
          .at(0)
          .containsMatchingElement(<span>Configure suggestions</span>)
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
    it('should confirm  before deleting the thesaurus', done => {
      render();
      component
        .instance()
        .deleteThesaurus({ _id: 'thesaurusUnderscoreId2', name: 'Issues' })
        .then(() => {
          expect(props.mainContext.confirm).toHaveBeenCalled();
          expect(props.checkThesaurusCanBeDeleted).toHaveBeenCalled();
          done();
        });
    });
  });
});
