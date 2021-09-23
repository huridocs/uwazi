import React from 'react';
import { Translate } from 'app/I18N';
import { Switcher } from 'app/ReactReduxForms';
import { IStore } from 'app/istore';
import { connect, ConnectedProps } from 'react-redux';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import { bindActionCreators, Dispatch } from 'redux';
import { filterDocumentTypes } from 'app/Library/actions/filterActions';
import { wrapDispatch } from 'app/Multireducer';
import _ from 'lodash';

interface TemplatesFilterProps {
  storeKey: string;
}

interface TemplatesFilterState {
  documentTypeFromFilters: boolean;
  selectedTemplates: string[];
  configuredFilters: string[];
}

const mapStateToProps = (state: IStore) => ({
  settings: state.settings,
  libraryFilters: state.library.filters,
});

function mapDispatchToProps(dispatch: Dispatch<IStore>, props: TemplatesFilterProps) {
  return bindActionCreators({ filterDocumentTypes }, wrapDispatch(dispatch, props.storeKey));
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = TemplatesFilterProps & MappedProps;

const filterValidSelectedTemplates = (configuredFilters: string[], selectedTemplates: string[]) =>
  configuredFilters.length
    ? selectedTemplates.filter(t => configuredFilters.includes(t))
    : selectedTemplates;

export class TemplatesFilterComponent extends React.Component<
  ComponentProps,
  TemplatesFilterState
> {
  constructor(props: ComponentProps) {
    super(props);
    const configuredFilters: string[] = (props.settings.collection.toJS().filters || []).map(
      f => f.id!
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

export const TemplatesFilter = connector(TemplatesFilterComponent);
