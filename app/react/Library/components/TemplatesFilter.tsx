import React from 'react';
import { Translate } from 'app/I18N';
import { Switcher } from 'app/ReactReduxForms';
import { IStore } from 'app/istore';
import { connect } from 'react-redux';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import { IImmutable } from 'shared/types/Immutable';
import { Settings } from 'shared/types/settingsType';
import { bindActionCreators, Dispatch } from 'redux';
import { filterDocumentTypes } from 'app/Library/actions/filterActions';
import { wrapDispatch } from 'app/Multireducer';

interface TemplatesFilterProps {
  settings: { collection: IImmutable<Settings> };
  libraryFilters: IImmutable<{ documentTypes: [] }>;
  storeKey: string;
  filterDocumentTypes: (documentTypes: string[], storeKey: string) => {};
}

interface TemplatesFilterState {
  documentTypeFromFilters: boolean;
  selectedTemplates: string[];
  configuredFilters: string[];
}

const filterValidSelectedTemplates = (configuredFilters: string[], selectedTemplates: string[]) =>
  configuredFilters.length
    ? selectedTemplates.filter(t => configuredFilters.includes(t))
    : selectedTemplates;

export class TemplatesFilterComponent extends React.Component<
  TemplatesFilterProps,
  TemplatesFilterState
> {
  constructor(props: TemplatesFilterProps) {
    super(props);
    const configuredFilters: string[] = (props.settings.collection.toJS().filters || []).map(
      f => f.id!
    );
    this.state = {
      documentTypeFromFilters: true,
      selectedTemplates: [],
      configuredFilters,
    };
  }

  static getDerivedStateFromProps(props: TemplatesFilterProps, state: TemplatesFilterState) {
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
      this.props.filterDocumentTypes(newSelectedItems, this.props.storeKey);
    }
    this.setState({ documentTypeFromFilters: checked });
  }

  render() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          {this.state.configuredFilters.length > 0 && (
            <li>
              <Translate>Templates</Translate>
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
                leftLabel="FILTERS"
                rightLabel="ALL"
              />
            </li>
          )}
          <li className="wide documentTypes-selector">
            <DocumentTypesList
              storeKey={this.props.storeKey}
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

const mapStateToProps = (state: IStore) => ({
  settings: state.settings,
  libraryFilters: state.library.filters,
});

function mapDispatchToProps(dispatch: Dispatch<IStore>, props: TemplatesFilterProps) {
  return bindActionCreators({ filterDocumentTypes }, wrapDispatch(dispatch, props.storeKey));
}

export const TemplatesFilter = connect(
  mapStateToProps,
  mapDispatchToProps
)(TemplatesFilterComponent);
