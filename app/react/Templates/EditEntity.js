import React from 'react';
import EditTemplate from './EditTemplate';
import TemplateCreator from './components/TemplateCreator';

export default class EditEntity extends EditTemplate {
  render() {
    return <TemplateCreator entity={true}/>;
  }
}
