import React from 'react';
import { isUndefined } from 'lodash';
import { connect, ConnectedProps } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ClientPropertySchema, ClientTemplateSchema, IStore } from 'app/istore';
import { acceptSuggestion } from 'app/MetadataExtraction/actions/actions';
import { EntitySuggestions } from 'app/MetadataExtraction/EntitySuggestions';
import { IImmutable } from 'shared/types/Immutable';
import { ensure } from 'shared/tsUtils';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { IXExtractorInfo } from './ExtractorModal';

const SuggestionComponent = ({
  templates,
  acceptSuggestion: acceptIXSuggestion,
  languages,
  extractors,
}: ComponentProps) => {
  const { extractorId } = useParams();
  const extractor = extractors.find(
    (extractor: IImmutable<IXExtractorInfo>) => extractorId === extractor.get('_id')
  );
  const propertiesKey = extractor.get('property') === 'title' ? 'commonProperties' : 'properties';

  const property = templates
    .map(template =>
      ensure<IImmutable<ClientTemplateSchema>>(template)
        .get(propertiesKey)
        ?.find(p => p?.get('name') === extractor.get('property'))
    )
    .filter(v => !isUndefined(v));

  if (property && property.size > 0) {
    return (
      <div className="settings-content">
        <EntitySuggestions
          property={property.get(0)?.toJS() as ClientPropertySchema}
          acceptIXSuggestion={acceptIXSuggestion}
          languages={languages?.toArray()}
          extractor={extractor.toJS()}
        />
      </div>
    );
  }
  return (
    <div className="settings-content">
      <GeneralError />
    </div>
  );
};

const mapStateToProps = (state: IStore) => ({
  templates: state.templates,
  languages: state.settings.collection.get('languages'),
  extractors: state.ixExtractors,
});

const mapDispatchToProps = {
  acceptSuggestion,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;

type ComponentProps = MappedProps;

export const IXSuggestions = connect(mapStateToProps, mapDispatchToProps)(SuggestionComponent);
