import { Entity } from '#V2/api/entities/types.js';

type EditEntityProps = {
  entity?: Entity;
  onChange?: (editedEntity?: Entity) => void;
};

const EditEntity = ({ entity, onChange }: EditEntityProps) => {
  return entity?._id;
};

export { EditEntity };
