import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
import { QuickLabelPanelBase, QuickLabelPanelProps } from '../QuickLabelPanel';
import { documents, templates, thesauri } from '../../actions/specs/fixtures';

describe('QuickLabelPanel', () => {
  let component: ShallowWrapper<QuickLabelPanelProps, {}, QuickLabelPanelBase>;
  let props: Partial<QuickLabelPanelProps>;

  beforeEach(() => {
    props = {
      quickLabelMetadata: {
        opts: {
          added: [],
          removed: [],
          originalFull: [],
          originalPartial: ['v1', 'v2'],
        },
      },
      quickLabelThesaurus: Immutable.fromJS(thesauri[0]),
      opts: { autoSave: true, thesaurus: thesauri[0].name },
      selectedDocuments: Immutable.fromJS(documents),
      templates: Immutable.fromJS(templates),
      multipleUpdate: jasmine.createSpy('multipleUpdate'),
    };
  });

  const render = () => {
    component = shallow(<QuickLabelPanelBase {...props} />);
  };

  it('should render correctly', () => {
    render();
    expect(component).toMatchSnapshot();
  });
});
