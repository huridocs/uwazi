import type { ClientProperty } from '#V2/shared/types.js';

type OrderedProperty = {
  _id: string;
  propertyGroup?: ReadonlyArray<{ _id?: string }>;
};

const templateOrderMap = (templateProperties: ClientProperty[] | undefined) => {
  const order = new Map<string, number>();
  templateProperties?.forEach((property, index) => {
    if (typeof property._id === 'string') {
      order.set(property._id, index);
    }
  });
  return order;
};

const fieldTemplateIndex = (field: OrderedProperty, order: Map<string, number>): number => {
  const direct = order.get(field._id);
  if (direct !== undefined) {
    return direct;
  }
  let min = Number.MAX_SAFE_INTEGER;
  field.propertyGroup?.forEach(member => {
    if (typeof member._id !== 'string') {
      return;
    }
    const memberIndex = order.get(member._id);
    if (memberIndex !== undefined && memberIndex < min) {
      min = memberIndex;
    }
  });
  return min;
};

const sortByTemplatePropertyOrder = <T extends OrderedProperty>(
  items: T[],
  templateProperties: ClientProperty[] | undefined
): T[] => {
  if (!templateProperties?.length) {
    return [...items];
  }
  const order = templateOrderMap(templateProperties);
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ao = fieldTemplateIndex(a.item, order);
      const bo = fieldTemplateIndex(b.item, order);
      return ao - bo || a.index - b.index;
    })
    .map(({ item }) => item);
};

export { sortByTemplatePropertyOrder };
export type { OrderedProperty };
