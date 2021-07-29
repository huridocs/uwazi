import React from 'react';
import { connect } from 'react-redux';

import { IImmutable } from 'shared/types/Immutable';
import { TemplateSchema } from 'shared/types/templateType';

export interface MetadataExtractionDashboardPropTypes {
  templates: IImmutable<TemplateSchema[]>;
  extractionSettings: Map<string, string | Array<string>>[];
}

function mapStateToProps({ settings, templates }: any) {
  return {
    extractionSettings: settings.collection.get('features')?.get('metadata-extraction'),
    templates,
  };
}

class MetadataExtractionDashboard extends React.Component<MetadataExtractionDashboardPropTypes> {
  arrangeTemplatesAndProperties() {
    const result: { [key: string]: Array<string> } = {};

    this.props.extractionSettings.forEach(setting => {
      const template = setting.has('id')
        ? this.props.templates.find(t => t?.get('_id') === setting.get('id'))
        : this.props.templates.find(t => t?.get('name') === setting.get('name'));
      if (!template) {
        throw new Error(`Template "${setting.get('_id') || setting.get('name')}" not found.`);
      }

      const properties: Array<string> = setting.get('properties');
      properties.forEach(propLabel => {
        const prop =
          template.get('properties')?.find(p => p?.get('label') === propLabel) ||
          template.get('commonProperties')?.find(p => p?.get('label') === propLabel);
        if (!prop) {
          throw new Error(
            `Property "${propLabel}" not found on template "${template.get('name')}".`
          );
        }
        if (!result.hasOwnProperty(propLabel)) {
          result[propLabel] = [template.get('name')];
        } else {
          result[propLabel].push(template.get('name'));
        }
      });
    });

    return result;
  }

  render() {
    return (
      <>
        <div>Arranged: {JSON.stringify(this.arrangeTemplatesAndProperties())}</div>
      </>
    );
  }
}

export default connect(mapStateToProps)(MetadataExtractionDashboard);
