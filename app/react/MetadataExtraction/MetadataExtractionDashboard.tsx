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
import { saveConfigurations, createExtractor } from './actions/actions';
import { IXExtractorInfo, ExtractorCreationModal } from './ExtractorCreationModal';

function mapStateToProps({ settings, templates, ixextractors }: any) {
  return {
    settings: settings.collection,
    templates,
    ixextractors,
  };
}

class MetadataExtractionComponent extends React.Component<
  MetadataExtractionDashboardPropTypes,
  MetadataExtractionDashboardStateTypes
> {
  constructor(props: MetadataExtractionDashboardPropTypes) {
    super(props);
    this.saveConfigs = this.saveConfigs.bind(this);
    this.createExtractor = this.createExtractor.bind(this);
    this.state = {
      configurationModalIsOpen: false,
      creationModelIsOpen: false,
    };
  }

  arrangeTemplatesAndProperties() {
    const formatted: FormattedSettingsData = {};

    const extractionSettings =
      this.props.settings.get('features')?.get('metadataExtraction')?.get('templates') || [];

    extractionSettings.forEach((setting: any) => {
      const template = setting.has('template')
        ? this.props.templates.find(temp => temp?.get('_id') === setting.get('template'))
        : this.props.templates.find(temp => temp?.get('name') === setting.get('name'));

      if (!template) {
        store?.dispatch(
          notify(`Template "${setting.get('_id') || setting.get('name')}" not found.`, 'warning')
        );
        return;
      }

      const rawProperties = setting.get('properties');
      const properties: Array<string> | undefined =
        typeof rawProperties === 'string' ? [rawProperties] : rawProperties;
      properties?.forEach(propertyName => {
        let property = template.get('properties')?.find(p => p?.get('name') === propertyName);
        let label;
        if (!property) {
          property = template.get('commonProperties')?.find(p => p?.get('name') === propertyName);
          label = propertyName;
        } else {
          label = property.get('label');
        }
        if (!property) {
          store?.dispatch(
            notify(
              `Property "${label}" not found on template "${template.get('name')}".`,
              'warning'
            )
          );
          return;
        }
        if (!formatted.hasOwnProperty(propertyName)) {
          formatted[propertyName] = {
            properties: [property.toJS()],
            templates: [template.toJS()],
          };
        } else {
          formatted[propertyName].properties.push(property.toJS());
          formatted[propertyName].templates.push(template.toJS());
        }
      });
    });

    return formatted;
  }

  async saveConfigs(newSettingsConfigs: IXTemplateConfiguration[]) {
    this.setState({ configurationModalIsOpen: false });
    await this.props.saveConfigurations(newSettingsConfigs);
  }

  async createExtractor(extractorInfo: IXExtractorInfo) {
    this.setState({ creationModelIsOpen: false });
    await this.props.createExtractor(extractorInfo);
  }

  render() {
    const formattedData: FormattedSettingsData = this.arrangeTemplatesAndProperties();
    // const extractionSettings =
    //   this.props.settings.toJS().features!.metadataExtraction!.templates || [];

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
                {Object.entries(formattedData).map(([propIndex, data]) => (
                  <tr key={propIndex}>
                    <td />
                    <td>
                      <Icon icon={Icons[data.properties[0].type]} fixedWidth />
                      {data.properties[0].label}
                    </td>
                    <td className="templateNameViewer">
                      {data.templates.map((template, index) => (
                        <div key={template.name}>
                          {template.name}
                          {index !== data.templates.length - 1 ? ',' : ''}
                        </div>
                      ))}
                    </td>
                    <td>
                      <I18NLink
                        to={`settings/metadata_extraction/suggestions/${data.properties[0].name}`}
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
  saveConfigurations: (configurations: IXTemplateConfiguration[]) => void;
  createExtractor: (extractorInfo: IXExtractorInfo) => void;
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
  bindActionCreators({ saveConfigurations, createExtractor }, dispatch);

export const MetadataExtractionDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(MetadataExtractionComponent);
