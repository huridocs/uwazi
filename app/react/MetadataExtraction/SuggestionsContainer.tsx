import React from 'react';
import { isUndefined } from 'lodash';
import { connect, ConnectedProps } from 'react-redux';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { ClientPropertySchema, ClientTemplateSchema, IStore } from 'app/istore';
import { acceptSuggestion, loadExtractor } from 'app/MetadataExtraction/actions/actions';
import { EntitySuggestions } from 'app/MetadataExtraction/EntitySuggestions';
import { IImmutable } from 'shared/types/Immutable';
import { ensure } from 'shared/tsUtils';
import GeneralError from 'app/App/ErrorHandling/GeneralError';
import { IXExtractorInfo } from 'V2/Routes/Settings/IX/types';
import { IncomingHttpHeaders } from 'http';

const SuggestionComponent = ({
  templates,
  acceptSuggestion: acceptIXSuggestion,
  languages,
}: ComponentProps) => {
  const extractor = useLoaderData() as IXExtractorInfo;
  let property;

  if (extractor) {
    const propertiesKey = extractor.property === 'title' ? 'commonProperties' : 'properties';
    property = templates
      .map(template =>
        ensure<IImmutable<ClientTemplateSchema>>(template)
          .get(propertiesKey)
          ?.find(p => p?.get('name') === extractor.property)
      )
      .filter(v => !isUndefined(v));
  }

  if (property && property.size > 0) {
    return (
      <div className="settings-content">
        <EntitySuggestions
          property={property.get(0)?.toJS() as ClientPropertySchema}
          acceptIXSuggestion={acceptIXSuggestion}
          languages={languages?.toArray()}
          extractor={extractor}
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
});

const mapDispatchToProps = {
  acceptSuggestion,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;

type ComponentProps = MappedProps;

export const IXSuggestions = connect(mapStateToProps, mapDispatchToProps)(SuggestionComponent);

export const IXSuggestionsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params: { extractorId } }) => {
    const extractors = await loadExtractor({ id: extractorId! }, headers);
    return extractors[0];
  };
