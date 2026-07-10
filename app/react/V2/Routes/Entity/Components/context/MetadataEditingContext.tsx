import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type MetadataEditingState = { isEditing: boolean; isSaving: boolean; saveError?: string };
type MetadataEditingActions = {
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | undefined>>;
  registerCancelEdit: (handler: () => void) => () => void;
  cancelEdit: () => void;
};

const MetadataEditingStateContext = createContext<MetadataEditingState | null>(null);
const MetadataEditingActionsContext = createContext<MetadataEditingActions | null>(null);

const MetadataEditingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const cancelEditRef = useRef<(() => void) | null>(null);

  const registerCancelEdit = useCallback((handler: () => void) => {
    cancelEditRef.current = handler;
    return () => {
      if (cancelEditRef.current === handler) cancelEditRef.current = null;
    };
  }, []);

  const cancelEdit = useCallback(() => {
    if (cancelEditRef.current) {
      cancelEditRef.current();
      return;
    }
    setSaveError(undefined);
    setIsEditing(false);
  }, []);

  const state = useMemo(
    () => ({ isEditing, isSaving, saveError }),
    [isEditing, isSaving, saveError]
  );
  const actions = useMemo(
    () => ({ setIsEditing, setIsSaving, setSaveError, registerCancelEdit, cancelEdit }),
    [registerCancelEdit, cancelEdit]
  );

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
