import React, { createContext, useContext } from 'react';
import { FormProvider } from 'react-hook-form';
import { useMetadataEditingController } from './hooks/useMetadataEditingController.js';
import {
  EDIT_ENTITY_FORM_ID,
  type MetadataEditingActions,
  type MetadataEditingState,
} from './metadataEditingTypes.js';

const MetadataEditingStateContext = createContext<MetadataEditingState | null>(null);
const MetadataEditingActionsContext = createContext<MetadataEditingActions | null>(null);

const MetadataEditingProvider = ({ children }: { children: React.ReactNode }) => {
  const { state, actions } = useMetadataEditingController();

  return (
    <MetadataEditingActionsContext.Provider value={actions}>
      <MetadataEditingStateContext.Provider value={state}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <FormProvider {...state.form}>{children}</FormProvider>
      </MetadataEditingStateContext.Provider>
    </MetadataEditingActionsContext.Provider>
  );
};

const useMetadataEditingState = () => {
  const context = useContext(MetadataEditingStateContext);
  if (!context) throw new Error('Metadata editing state context not found');
  return context;
};

const useMetadataEditingActions = () => {
  const context = useContext(MetadataEditingActionsContext);
  if (!context) throw new Error('Metadata editing actions context not found');
  return context;
};

const useMetadataEditing = () => ({
  ...useMetadataEditingState(),
  ...useMetadataEditingActions(),
});

export { MetadataEditingProvider, useMetadataEditing, EDIT_ENTITY_FORM_ID };
