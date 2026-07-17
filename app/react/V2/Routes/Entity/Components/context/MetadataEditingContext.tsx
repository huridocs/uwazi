import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type MetadataEditingHost = 'main' | 'side';

type MetadataEditingState = {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  editingHost: MetadataEditingHost | null;
  saveError?: string;
};
type MetadataEditingActions = {
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setEditingHost: React.Dispatch<React.SetStateAction<MetadataEditingHost | null>>;
  startEditing: (host: MetadataEditingHost) => void;
  registerCancelEdit: (handler: () => void) => () => void;
  cancelEdit: () => void;
};

const MetadataEditingStateContext = createContext<MetadataEditingState | null>(null);
const MetadataEditingActionsContext = createContext<MetadataEditingActions | null>(null);

const MetadataEditingProvider = ({ children }: { children: React.ReactNode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [editingHost, setEditingHost] = useState<MetadataEditingHost | null>(null);
  const [saveError, setSaveError] = useState<string>();
  const cancelEditRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef({ isEditing: false, editingHost: null as MetadataEditingHost | null });
  sessionRef.current = { isEditing, editingHost };

  const registerCancelEdit = useCallback((handler: () => void) => {
    cancelEditRef.current = handler;
    return () => {
      if (cancelEditRef.current === handler) cancelEditRef.current = null;
    };
  }, []);

  const startEditing = useCallback((host: MetadataEditingHost) => {
    const session = sessionRef.current;
    if (session.isEditing && session.editingHost && session.editingHost !== host) {
      return;
    }
    setEditingHost(host);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    if (cancelEditRef.current) {
      cancelEditRef.current();
      setIsDirty(false);
      setEditingHost(null);
      return;
    }
    setSaveError(undefined);
    setIsDirty(false);
    setIsEditing(false);
    setEditingHost(null);
  }, []);

  const state = useMemo(
    () => ({ isEditing, isSaving, isDirty, editingHost, saveError }),
    [isEditing, isSaving, isDirty, editingHost, saveError]
  );
  const actions = useMemo(
    () => ({
      setIsEditing,
      setIsSaving,
      setIsDirty,
      setSaveError,
      setEditingHost,
      startEditing,
      registerCancelEdit,
      cancelEdit,
    }),
    [registerCancelEdit, cancelEdit, startEditing]
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

export type { MetadataEditingHost };
export { MetadataEditingProvider, useMetadataEditing };
