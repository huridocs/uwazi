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
import saveSettings from 'app/Settings/actions/settingsActions';
import { PropertyConfigurationModal } from './PropertyConfigurationModal';

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

  render() {
    const formattedData: FormattedSettingsData = this.arrangeTemplatesAndProperties();
    const extractionSettings =
      this.props.settings.toJS().features!.metadataExtraction!.templates || [];

    return (
      <div className="settings-content">
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
            onAccept={newSettings => {
              this.setState({ configurationModalIsOpen: false });
              const settings = this.props.settings.toJS();

              settings.features!.metadataExtraction!.templates = newSettings;
              this.props.saveSettings(settings);
            }}
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
  saveSettings: (settings: Settings) => void;
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
  bindActionCreators({ saveSettings: saveSettings }, dispatch);

export const MetadataExtractionDashboard = connect(
  mapStateToProps,
  mapDispatchToProps
)(MetadataExtractionComponent);
