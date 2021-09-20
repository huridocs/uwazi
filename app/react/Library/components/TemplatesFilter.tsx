import React from 'react';
import { Translate } from 'app/I18N';
import { Switcher } from 'app/ReactReduxForms';
import { IStore } from 'app/istore';
import { connect } from 'react-redux';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import { IImmutable } from 'shared/types/Immutable';
import { Settings } from 'shared/types/settingsType';

interface TemplatesFilterProps {
  settings: { collection: IImmutable<Settings> };
  storeKey: string;
}

interface TemplatesFilterState {
  documentTypeFromFilters: boolean;
}
export class TemplatesFilterComponent extends React.Component<
  TemplatesFilterProps,
  TemplatesFilterState
> {
  constructor(props: TemplatesFilterProps) {
    super(props);
    this.state = { documentTypeFromFilters: true };
  }

  render() {
    const { settings } = this.props;
    const configuredFilters = (settings.collection.toJS().filters || []).length > 0;
    return (
      <div className="form-group">
        <ul className="search__filter">
          {configuredFilters && (
            <li>
              <Translate>Templates</Translate>
              <Switcher
                className="template-filter-switcher"
                model=""
                onChange={(checked: boolean) => {
                  this.setState({ documentTypeFromFilters: checked });
                }}
                leftLabel="FILTERS"
                rightLabel="ALL"
              />
            </li>
          )}
          <li className="wide documentTypes-selector">
            <DocumentTypesList
              storeKey={this.props.storeKey}
              fromFilters={this.state.documentTypeFromFilters && configuredFilters}
            />
          </li>
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state: IStore) => ({
  settings: state.settings,
});

export const TemplatesFilter = connect(mapStateToProps)(TemplatesFilterComponent);
