import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';
import { RequestParams } from 'app/utils/RequestParams';
import { Translate, I18NLink } from 'app/I18N';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import Icons from 'app/Templates/components/Icons';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import { ClientSettings } from 'app/apiResponseTypes';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import { loadExtractors, deleteExtractors } from './actions/actions';
import { IXExtractorInfo, ExtractorModal } from './ExtractorModal';
import {
  createExtractor as createExtractorAPICall,
  updateExtractor as updateExtractorAPICall,
} from './SuggestionsAPI';

type indexedTemplates = {
  [k: string]: {
    _id: string;
    name: string;
    properties: { [k: string]: PropertySchema };
  };
};

type preparedExtractor = IXExtractorInfo & {
  label?: string;
  type?: PropertySchema['type'];
};

function mapStateToProps({ settings, templates, ixExtractors }: any) {
  return {
    settings: settings.collection,
    templates,
    ixExtractors,
  };
}

class MetadataExtractionComponent extends React.Component<
  MetadataExtractionDashboardPropTypes,
  MetadataExtractionDashboardStateTypes
> {
  constructor(props: MetadataExtractionDashboardPropTypes) {
    super(props);
    this.saveExtractor = this.saveExtractor.bind(this);
    this.deleteExtractors = this.deleteExtractors.bind(this);
    this.state = {
      extractorModelIsOpen: false,
      selectedExtractorIds: new Set<string>(),
      extractorToEdit: undefined,
    };
  }

  async componentDidMount(): Promise<void> {
    await this.props.loadExtractors();
  }

  handleExtractorSelection(extractorId: string, selected: boolean) {
    const { selectedExtractorIds } = this.state;
    if (selected) {
      selectedExtractorIds.add(extractorId);
    } else {
      selectedExtractorIds.delete(extractorId);
    }
    this.setState({ selectedExtractorIds });
  }

  async saveExtractor(extractorInfo: IXExtractorInfo) {
    const params = new RequestParams(extractorInfo);
    if (extractorInfo._id) {
      await updateExtractorAPICall(params);
      this.setState({ selectedExtractorIds: new Set<string>() });
    } else {
      await createExtractorAPICall(params);
    }

    this.props.loadExtractors();
    this.setState({ extractorModelIsOpen: false });
  }

  async deleteExtractors() {
    await this.props.deleteExtractors(
      this.props.ixExtractors.toJS(),
      Array.from(this.state.selectedExtractorIds)
    );
    this.setState({ selectedExtractorIds: new Set<string>() });
  }

  prepareTemplates() {
    const templates: TemplateSchema[] = this.props.templates.toJS();
    const indexed: indexedTemplates = Object.fromEntries(
      templates.map(t => [
        t._id,
        {
          _id: t._id,
          name: t.name,
          properties: Object.fromEntries(
            (t.properties || [])
              .map(p => [p.name, p])
              .concat([['title', { name: 'title', label: 'Title', type: 'text' }]])
          ),
        },
      ])
    );
    return indexed;
  }

  prepareExtractors(extractorList: IXExtractorInfo[], templateInfo: indexedTemplates) {
    const shownExtractors: preparedExtractor[] = extractorList.map(extractor => {
      if (extractor.templates.length === 0) return extractor;
      const firstTemplate = extractor.templates[0];
      if (!(firstTemplate in templateInfo)) {
        store?.dispatch(notify(`Template ${firstTemplate} not found.`, 'warning'));
        return extractor;
      }
      const properties = templateInfo[firstTemplate].properties;
      if (!(extractor.property in properties)) {
        store?.dispatch(
          notify(
            `Property ${extractor.property} not found on template ${firstTemplate}.`,
            'warning'
          )
        );
        return extractor;
      }
      const property = properties[extractor.property];
      return {
        ...extractor,
        type: property.type,
        label: property.label,
      };
    });
    return shownExtractors;
  }

  render() {
    const extractorList: IXExtractorInfo[] = this.props.ixExtractors.toJS();
    const templateInfo = this.prepareTemplates();
    const shownExtractors = this.prepareExtractors(extractorList, templateInfo);

    return (
      <div className="settings-content">
        <div className="panel panel-default">
          <SettingsHeader>
            <Translate>Metadata extraction dashboard</Translate>
          </SettingsHeader>
          <div className="panel-subheading">
            <Translate>Extract information from your documents</Translate>
          </div>
          <ExtractorModal
            isOpen={this.state.extractorModelIsOpen}
            onClose={() => this.setState({ extractorModelIsOpen: false })}
            onAccept={this.saveExtractor}
            templates={this.props.templates.toJS()}
            extractor={this.state.extractorToEdit}
          />
          <div className="metadata-extraction-table">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <span className="extractor-checkbox">
                      <Icon icon={['far', 'square']} className="checkbox-empty" />
                    </span>
                    <Translate>Extractor Name</Translate>
                  </th>
                  <th>
                    <Translate>Property</Translate>
                  </th>
                  <th>
                    <Translate>Template(s)</Translate>
                  </th>
                  <th>
                    <Translate>Action</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownExtractors.map(extractor => (
                  <tr key={extractor.name + extractor._id}>
                    <td>
                      <span className="extractor-checkbox">
                        <input
                          type="checkbox"
                          value={extractor._id}
                          onChange={event => {
                            if (extractor._id) {
                              this.handleExtractorSelection(
                                event.target.value,
                                event.target.checked
                              );
                            }
                          }}
                        />
                      </span>
                      {extractor.name}{' '}
                    </td>
                    <td>
                      <Icon icon={Icons[extractor.type || 'text']} fixedWidth />
                      {extractor.label || extractor.property}
                    </td>

                    <td className="templateNameViewer">
                      {extractor.templates.map(template => (
                        <span key={template}>{templateInfo[template].name}</span>
                      ))}
                    </td>
                    <td>
                      <I18NLink
                        to={`settings/metadata_extraction/suggestions/${extractor._id}`}
                        className="btn btn-success btn-xs"
                      >
                        <Translate>Review</Translate>
                      </I18NLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="settings-footer">
            <div className="btn-cluster">
              {this.state.selectedExtractorIds.size > 0 ? (
                <button
                  className="btn btn-default"
                  type="button"
                  onClick={() => {
                    const selectedExtractorId = Array.from(this.state.selectedExtractorIds)[0];
                    const extractorToEdit = this.props.ixExtractors
                      .toJS()
                      .find((extractor: IXExtractorInfo) => extractor._id === selectedExtractorId);
                    this.setState({ extractorToEdit });
                    this.setState({ extractorModelIsOpen: true });
                  }}
                >
                  <Translate>Edit Extractor</Translate>
                </button>
              ) : (
                <button
                  className="btn btn-default"
                  type="button"
                  onClick={() => {
                    this.setState({ extractorModelIsOpen: true });
                  }}
                >
                  <Translate>Create Extractor</Translate>
                </button>
              )}

              {!!this.state.selectedExtractorIds.size && (
                <button className="btn btn-danger" type="button" onClick={this.deleteExtractors}>
                  <Translate>Delete</Translate>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export interface MetadataExtractionDashboardPropTypes {
  templates: IImmutable<TemplateSchema[]>;
  settings: IImmutable<ClientSettings>;
  ixExtractors: IImmutable<IXExtractorInfo[]>;
  deleteExtractors: (currentExtractors: IXExtractorInfo[], extractorIds: string[]) => void;
  loadExtractors: () => void;
}

export interface FormattedSettingsData {
  [key: string]: {
    properties: PropertySchema[];
    templates: TemplateSchema[];
  };
}

export interface MetadataExtractionDashboardStateTypes {
  extractorModelIsOpen: boolean;
  selectedExtractorIds: Set<string>;
  extractorToEdit?: IXExtractorInfo;
}

export const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ deleteExtractors, loadExtractors }, dispatch);

export const MetadataExtractionDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(MetadataExtractionComponent);
