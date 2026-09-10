import { useRef, useState } from 'react';

const useMetadataEditingFlags = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isEditingRef = useRef(false);
  const isDirtyRef = useRef(false);
  isEditingRef.current = isEditing;
  isDirtyRef.current = isDirty;
  return { isEditing, setIsEditing, isDirty, setIsDirty, isEditingRef, isDirtyRef };
};

export { useMetadataEditingFlags };
