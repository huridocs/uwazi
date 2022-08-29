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
import { Settings } from 'shared/types/settingsType';
import { saveConfigurations } from './actions/actions';
import { IXTemplateConfiguration, PropertyConfigurationModal } from './PropertyConfigurationModal';

function mapStateToProps({ settings, templates }: any) {
  return {
    settings: settings.collection,
    templates,
  };
}

class MetadataExtractionComponent extends React.Component<
  MetadataExtractionDashboardPropTypes,
  MetadataExtractionDashboardStateTypes
> {
  constructor(props: MetadataExtractionDashboardPropTypes) {
    super(props);
    this.saveConfigs = this.saveConfigs.bind(this);
    this.state = {
      configurationModalIsOpen: false,
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

  render() {
    const formattedData: FormattedSettingsData = this.arrangeTemplatesAndProperties();
    const extractionSettings =
      this.props.settings.toJS().features!.metadataExtraction!.templates || [];

    return (
      <div className="settings-content without-footer">
        <div className="panel panel-default">
          <div className="panel-heading">
            <Translate>Metadata extraction dashboard</Translate>
          </div>
          <div className="panel-subheading">
            <Translate>Extract information from your documents</Translate>
          </div>
          <button
            className="btn btn-default"
            type="button"
            onClick={() => {
              this.setState({ configurationModalIsOpen: true });
            }}
          >
            <Translate>Configure properties</Translate>
          </button>
          <PropertyConfigurationModal
            isOpen={this.state.configurationModalIsOpen}
            onClose={() => this.setState({ configurationModalIsOpen: false })}
            onAccept={this.saveConfigs}
            templates={this.props.templates.toJS()}
            currentProperties={extractionSettings}
          />
          <div className="metadata-extraction-table">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <Translate>Metadata to extract</Translate>
                  </th>
                  <th>
                    <Translate>Template</Translate>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(formattedData).map(([propIndex, data]) => (
                  <tr key={propIndex}>
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
        </div>
      </div>
    );
  }
}

export interface MetadataExtractionDashboardPropTypes {
  templates: IImmutable<TemplateSchema[]>;
  settings: IImmutable<Settings>;
  saveConfigurations: (configurations: IXTemplateConfiguration[]) => void;
}

export interface FormattedSettingsData {
  [key: string]: {
    properties: PropertySchema[];
    templates: TemplateSchema[];
  };
}

export interface MetadataExtractionDashboardStateTypes {
  configurationModalIsOpen: boolean;
}

export const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ saveConfigurations }, dispatch);

export const MetadataExtractionDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(MetadataExtractionComponent);
