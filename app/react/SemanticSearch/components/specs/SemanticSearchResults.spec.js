import React from 'react';

import { shallow } from 'enzyme';

import Immutable from 'immutable';

import { SemanticSearchResults, mapStateToProps } from '../SemanticSearchResults';

describe('SemanticSearchResults', () => {
  let state;
  beforeEach(() => {
    state = {
      semanticSearch: {
        resultsFilters: {
          threshold: 0.3,
          minRelevantSentences: 1
        },
        search: {
          _id: 'id',
          searchTerm: 'query',
          documents: [],
          status: 'completed',
          results: [
            {
              semanticSearch: {
                averageScore: 0.4,
                results: [{ score: 0.6 }, { score: 0.5 }, { score: 0.2 }]
              }
            },
            {
              semanticSearch: {
                averageScore: 0.6,
                results: [{ score: 0.7 }, { score: 0.2 }, { score: 0.1 }]
              }
            }
          ]
        }
      }
    };
  });

  const getProps = () => {
    const _state = {
      ...state,
      semanticSearch: {
        search: Immutable.fromJS(state.semanticSearch.search)
      }
    };
    return mapStateToProps(_state);
  };

  const render = () => shallow(<SemanticSearchResults {...getProps()} />);

  it('should render results in ItemList', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });
  it('should only display items that match filters', () => {
    state.semanticSearch.resultsFilters = {
      threshold: 0.4,
      minRelevantSentences: 2
    };
    const component = render();
    expect(component).toMatchSnapshot();
  });
  describe('when the search is empty', () => {
    it('should render not found page', () => {
      state.semanticSearch.search = {};
      const component = render();
      expect(component).toMatchSnapshot();
    });
  });
});
