import { fromJS } from 'immutable';
import { SettingsFilterSchema } from 'shared/types/settingsType';
import { ConnectedComponent as TemplatesFilterComponent } from 'app/Library/components/TemplatesFilter';
import { renderConnected } from 'app/utils/test/renderConnected';
import { filterDocumentTypes } from 'app/Library/actions/filterActions';
import * as redux from 'redux';
import DocumentTypesList from '../DocumentTypesList';

jest.mock('app/Library/actions/filterActions');

describe('TemplatesFilter', () => {
  let component: any;
  const render = (
    templateFilters?: Partial<SettingsFilterSchema>[],
    selectedFilters?: String[]
  ) => {
    const store = {
      templates: fromJS([]),
      settings: {
        collection: fromJS({
          filters: templateFilters,
        }),
      },
      library: {
        filters: fromJS({ documentTypes: selectedFilters }),
      },
    };
    component = renderConnected(
      TemplatesFilterComponent,
      {
        storeKey: 'library',
        filterDocumentTypes: jasmine.createSpy('deleteAttachment'),
        location: { query: 'some query' },
      },
      store
    );
  };

  describe('documentTypeList mode toggle', () => {
    describe('configured filters', () => {
      beforeEach(() => {
        render([{ id: '1', name: 'Judge' }]);
      });

      it('should mark FEATURED as the default option', () => {
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().fromFilters).toBe(true);
      });

      it('should allows logged users to switch templates filter between ALL/FEATURED', () => {
        const documentTypesSwitcher = component.find('Switcher');
        documentTypesSwitcher.props().onChange(false);
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().fromFilters).toBe(false);
      });
    });

    describe('not configured filters', () => {
      it('should not render template filter toggle', () => {
        render();
        const documentTypesSwitcher = component.find('Switcher');
        expect(documentTypesSwitcher.length).toBe(0);
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().fromFilters).toBe(false);
      });
    });

    describe('libraryFilters', () => {
      it('should list all templates if the library filters are not present in configured filters', () => {
        spyOn(redux, 'bindActionCreators').and.callFake(propsToBind => propsToBind);
        render([{ id: '1', name: 'Judge' }], ['2']);
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().fromFilters).toBe(false);
        expect(documentTypesList.props().selectedTemplates).toEqual(['2']);
      });

      it('should remove the library filters not present in filters', () => {
        spyOn(redux, 'bindActionCreators').and.callFake(propsToBind => propsToBind);
        render([{ id: '1', name: 'Judge' }], ['2']);
        const documentTypesSwitcher = component.find('Switcher');
        documentTypesSwitcher.props().onChange(true);
        expect(filterDocumentTypes).toHaveBeenCalledWith([], { query: 'some query' }, undefined);
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().selectedTemplates.length).toBe(0);
      });

      it('should take in to account groups', () => {
        spyOn(redux, 'bindActionCreators').and.callFake(propsToBind => propsToBind);
        render([{ id: '1', name: 'Judge', items: [{ id: '2' }] }], ['2']);
        const documentTypesSwitcher = component.find('Switcher');
        documentTypesSwitcher.props().onChange(true);
        const documentTypesList = component.find(DocumentTypesList);
        expect(documentTypesList.props().selectedTemplates).toEqual(['2']);
      });
    });
  });
});
