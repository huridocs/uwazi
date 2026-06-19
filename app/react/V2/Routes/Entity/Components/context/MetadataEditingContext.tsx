import React, { createContext, useContext, useMemo, useState } from 'react';

type MetadataEditingState = { isEditing: boolean };
type MetadataEditingActions = {
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
};

const MetadataEditingStateContext = createContext<MetadataEditingState | null>(null);
const MetadataEditingActionsContext = createContext<MetadataEditingActions | null>(null);

const MetadataEditingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const state = useMemo(() => ({ isEditing }), [isEditing]);
  const actions = useMemo(() => ({ setIsEditing }), [setIsEditing]);

  return (
    <MetadataEditingActionsContext.Provider value={actions}>
      <MetadataEditingStateContext.Provider value={state}>
        {children}
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

export { MetadataEditingProvider, useMetadataEditing };
