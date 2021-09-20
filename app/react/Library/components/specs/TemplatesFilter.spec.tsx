import { fromJS, fromJS as Immutable } from 'immutable';
import { SettingsFilterSchema } from 'shared/types/settingsType';
import { TemplatesFilter } from 'app/Library/components/TemplatesFilter';
import { renderConnected } from 'app/utils/test/renderConnected';

describe('TemplatesFilter', () => {
  let component: any;
  const render = (templateFilters?: Partial<SettingsFilterSchema>[]) => {
    const props = {
      templates: Immutable([]),
      settings: {
        collection: fromJS({
          filters: templateFilters,
        }),
      },
    };
    component = renderConnected(TemplatesFilter, { storeKey: 'library' }, props);
  };

  describe('documentTypeList mode toggle', () => {
    describe('configured filters', () => {
      beforeEach(() => {
        render([{ id: '1', name: 'Judge' }]);
      });

      it('should mark FILTERS as the default option', () => {
        const documentTypesList = component.find('Connect(DocumentTypesList)');
        expect(documentTypesList.props().fromFilters).toBe(true);
      });

      it('should allows logged users to switch templates filter between ALL/FILTERS', () => {
        const documentTypesSwitcher = component.find('Switcher');
        documentTypesSwitcher.props().onChange(false);
        const documentTypesList = component.find('Connect(DocumentTypesList)');
        expect(documentTypesList.props().fromFilters).toBe(false);
      });
    });
    describe('not configured filters', () => {
      it('should not render template filter toggle', () => {
        render();
        const documentTypesSwitcher = component.find('Switcher');
        expect(documentTypesSwitcher.length).toBe(0);
        const documentTypesList = component.find('Connect(DocumentTypesList)');
        expect(documentTypesList.props().fromFilters).toBe(false);
      });
    });
  });
});
