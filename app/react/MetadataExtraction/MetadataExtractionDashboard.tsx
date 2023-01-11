import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { Icon } from 'UI';

import { Translate, I18NLink } from 'app/I18N';
import { notify } from 'app/Notifications/actions/notificationsActions';
import { store } from 'app/store';
import Icons from 'app/Templates/components/Icons';
import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import { ClientSettings } from 'app/apiResponseTypes';
import { SettingsHeader } from 'app/Settings/components/SettingsHeader';
import { saveConfigurations, loadExtractors, createExtractor } from './actions/actions';
import { IXExtractorInfo, ExtractorCreationModal } from './ExtractorCreationModal';

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
    this.createExtractor = this.createExtractor.bind(this);
    this.state = {
      configurationModalIsOpen: false,
      creationModelIsOpen: false,
    };
  }

  async componentDidMount(): Promise<void> {
    await this.props.loadExtractors();
  }

  async createExtractor(extractorInfo: IXExtractorInfo) {
    await this.props.createExtractor(extractorInfo);
    this.setState({ creationModelIsOpen: false });
  }

  prepareTemplates() {
    const templates: TemplateSchema[] = this.props.templates.toJS();
    const indexed: indexedTemplates = Object.fromEntries(
      templates.map(t => [
        t._id,
        {
          _id: t._id,
          name: t.name,
          properties: Object.fromEntries((t.properties || []).map(p => [p.name, p])),
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
          <ExtractorCreationModal
            isOpen={this.state.creationModelIsOpen}
            onClose={() => this.setState({ creationModelIsOpen: false })}
            onAccept={this.createExtractor}
            templates={this.props.templates.toJS()}
          />
          <div className="metadata-extraction-table">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <Translate>Extractor Name</Translate>
                  </th>
                  <th>
                    <Translate>Property</Translate>
                  </th>
                  <th>
                    <Translate>Template(s)</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownExtractors.map(extractor => (
                  <tr key={extractor.name + extractor._id}>
                    <td> {extractor.name} </td>
                    <td>
                      <Icon icon={Icons[extractor.type || 'text']} fixedWidth />
                      {extractor.label || extractor.property}
                    </td>
                    <td className="templateNameViewer">
                      {extractor.templates.map((template, index) => (
                        <div key={template}>
                          {templateInfo[template].name}
                          {index !== extractor.templates.length - 1 ? ',' : ''}
                        </div>
                      ))}
                    </td>
                    <td>
                      <I18NLink
                        to={`settings/metadata_extraction/suggestions/${extractor._id}`}
                        className="btn btn-success btn-xs"
                      >
                        <Icon icon="bars" />
                        &nbsp;
                        <Translate>Review</Translate>
                      </I18NLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="settings-footer">
            <button
              className="btn btn-default"
              type="button"
              onClick={() => {
                this.setState({ creationModelIsOpen: true });
              }}
            >
              <Translate>Create Extractor</Translate>
            </button>
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
  createExtractor: (extractorInfo: IXExtractorInfo) => void;
  loadExtractors: () => void;
}

export interface FormattedSettingsData {
  [key: string]: {
    properties: PropertySchema[];
    templates: TemplateSchema[];
  };
}

export interface MetadataExtractionDashboardStateTypes {
  configurationModalIsOpen: boolean;
  creationModelIsOpen: boolean;
}

export const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ saveConfigurations, createExtractor, loadExtractors }, dispatch);

export const MetadataExtractionDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(MetadataExtractionComponent);
