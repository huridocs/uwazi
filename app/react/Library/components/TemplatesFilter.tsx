import React from 'react';
import _ from 'lodash';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Switcher } from 'app/ReactReduxForms';
import { Translate } from 'app/I18N';
import { IStore } from 'app/istore';
import { NeedAuthorization } from 'app/Auth';
import { withRouter } from 'app/componentWrappers';
import { SettingsFilterSchema } from 'shared/types/settingsType';
import { filterDocumentTypes } from '../actions/filterActions';
import DocumentTypesList from './DocumentTypesList';

interface TemplatesFilterState {
  documentTypeFromFilters: boolean;
  selectedTemplates: string[];
  configuredFilters: string[];
}

interface TemplatesFiltersProps {
  location: {};
  navigate: Function;
}
const mapStateToProps = (state: IStore) => ({
  collection: state.settings.collection,
  libraryFilters: state.library.filters,
});

function mapDispatchToProps(dispatch: Dispatch<IStore>) {
  return bindActionCreators({ filterDocumentTypes }, dispatch);
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type ComponentProps = ConnectedProps<typeof connector> & TemplatesFiltersProps;

const filterValidSelectedTemplates = (configuredFilters: string[], selectedTemplates: string[]) =>
  configuredFilters.length
    ? selectedTemplates.filter(t => configuredFilters.includes(t))
    : selectedTemplates;

const flattenConfiguredFilters = (configuredFilters: SettingsFilterSchema[]) =>
  configuredFilters.reduce((result: string[], filter) => {
    if (filter.items && filter.items.length) {
      const items = filter.items.map(item => item.id!);
      result.push(...items);
    }
    result.push(filter.id!);
    return result;
  }, []);

class TemplatesFilterComponent extends React.Component<ComponentProps, TemplatesFilterState> {
  constructor(props: ComponentProps) {
    super(props);
    const configuredFilters: string[] = flattenConfiguredFilters(
      props.collection.toJS().filters || []
    );
    const currentSelection = props.libraryFilters.toJS().documentTypes || [];
    const newSelection = filterValidSelectedTemplates(configuredFilters, currentSelection);
    const documentTypeFromFilters = _.isEqual(currentSelection, newSelection);

    this.state = {
      documentTypeFromFilters,
      selectedTemplates: newSelection,
      configuredFilters,
    };
  }

  static getDerivedStateFromProps(props: ComponentProps, state: TemplatesFilterState) {
    const currentSelection = props.libraryFilters.toJS().documentTypes || [];
    const newSelection = state.documentTypeFromFilters
      ? filterValidSelectedTemplates(state.configuredFilters, currentSelection)
      : currentSelection;
    return { selectedTemplates: newSelection };
  }

  private toggleTemplateFilter(
    checked: boolean,
    configuredFilters: string[],
    selectedTemplates: string[]
  ) {
    if (checked) {
      const newSelectedItems = filterValidSelectedTemplates(configuredFilters, selectedTemplates);
      this.setState({ selectedTemplates: newSelectedItems });
      this.props.filterDocumentTypes(newSelectedItems, this.props.location, this.props.navigate);
    }
    this.setState({ documentTypeFromFilters: checked });
  }

  render() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          {this.state.configuredFilters.length > 0 && (
            <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
              <li>
                &nbsp;
                <Switcher
                  className="template-filter-switcher"
                  model=""
                  value={this.state.documentTypeFromFilters}
                  onChange={(checked: boolean) =>
                    this.toggleTemplateFilter(
                      checked,
                      this.state.configuredFilters,
                      this.state.selectedTemplates
                    )
                  }
                  leftLabel={<Translate>FEATURED</Translate>}
                  rightLabel={<Translate>ALL</Translate>}
                />
              </li>
            </NeedAuthorization>
          )}
          <li className="wide documentTypes-selector">
            <DocumentTypesList
              fromFilters={
                this.state.documentTypeFromFilters && this.state.configuredFilters.length > 0
              }
              selectedTemplates={this.state.selectedTemplates}
            />
          </li>
        </ul>
      </div>
    );
  }
}

export const ConnectedComponent = connector(TemplatesFilterComponent);

export const TemplatesFilter = connector(withRouter(TemplatesFilterComponent));
