import React from 'react';
import { Translate } from 'app/I18N';
import { Switcher } from 'app/ReactReduxForms';
import { IStore } from 'app/istore';
import { connect } from 'react-redux';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import { IImmutable } from 'shared/types/Immutable';
import { Settings } from 'shared/types/settingsType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { bindActionCreators, Dispatch } from 'redux';
import { filterDocumentTypes } from 'app/Library/actions/filterActions';
import { wrapDispatch } from 'app/Multireducer';

interface TemplatesFilterProps {
  settings: { collection: IImmutable<Settings> };
  libraryFilters: IImmutable<{ documentTypes: [] }>;
  storeKey: string;
  filterDocumentTypes: (documentTypes: ObjectIdSchema[], storeKey: string) => {};
}

interface TemplatesFilterState {
  documentTypeFromFilters: boolean;
  selectedTemplates: Array<any>;
}
export class TemplatesFilterComponent extends React.Component<
  TemplatesFilterProps,
  TemplatesFilterState
> {
  private readonly configuredFilters: (ObjectIdSchema | undefined)[];

  constructor(props: TemplatesFilterProps) {
    super(props);
    this.configuredFilters = (props.settings.collection.toJS().filters || []).map(f => f.id);
    const selectedTemplates = props.libraryFilters.toJS().documentTypes || [];
    this.state = {
      documentTypeFromFilters: true,
      selectedTemplates: this.filterValidSelectedTemplates(selectedTemplates),
    };
  }

  private toggleTemplateFilter(checked: boolean, selectedTemplates: ObjectIdSchema[]) {
    if (checked) {
      const newSelectedItems = this.filterValidSelectedTemplates(selectedTemplates);
      this.setState({ selectedTemplates: newSelectedItems });
      this.props.filterDocumentTypes(newSelectedItems, this.props.storeKey);
    }
    this.setState({ documentTypeFromFilters: checked });
  }

  private filterValidSelectedTemplates(selectedTemplates: ObjectIdSchema[]) {
    return selectedTemplates.filter(t => this.configuredFilters.includes(t));
  }

  render() {
    return (
      <div className="form-group">
        <ul className="search__filter">
          {this.configuredFilters.length > 0 && (
            <li>
              <Translate>Templates</Translate>
              <Switcher
                className="template-filter-switcher"
                model=""
                value={this.state.documentTypeFromFilters}
                onChange={(checked: boolean) =>
                  this.toggleTemplateFilter(checked, this.state.selectedTemplates)
                }
                leftLabel="FILTERS"
                rightLabel="ALL"
              />
            </li>
          )}
          <li className="wide documentTypes-selector">
            <DocumentTypesList
              storeKey={this.props.storeKey}
              fromFilters={this.state.documentTypeFromFilters && this.configuredFilters.length > 0}
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
