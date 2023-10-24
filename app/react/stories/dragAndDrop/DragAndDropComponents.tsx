/* eslint-disable react/no-multi-comp */
import React, { FC, useCallback } from 'react';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Button } from 'app/V2/Components/UI';
import {
  Container,
  DragSource,
  DraggableItem,
  DropZone,
  IItemComponentProps,
  useDnDContext,
  IDnDContext,
} from 'app/V2/Components/Layouts/DragAndDrop';
import type { IDraggable } from 'app/V2/shared/types';
import debounce from 'app/utils/debounce';

interface DnDValueExample {
  name: string;
  items?: DnDValueExample[];
}

const sampleDefaultName = (item: IDraggable<DnDValueExample>) => item.value.name;

const sourceItems: IDraggable<DnDValueExample>[] = [
  { value: { name: 'Item 4' } },
  { value: { name: 'Item 5' } },
];

const CardWithRemove: FC<IItemComponentProps<DnDValueExample>> = ({ item, context }) => (
  <div className="flex flex-row items-center justify-center w-full">
    <div>{context.getDisplayName(item)}</div>
    <Button
      type="button"
      color="error"
      size="small"
      className="p-1 ml-auto"
      onClick={() => {
        context.removeItem(item);
      }}
    >
      <TrashIcon className="w-4" />
    </Button>
  </div>
);

const CardWithDnD: FC<IItemComponentProps<DnDValueExample>> = ({ item, context, index }) => (
  <div className="flex flex-col w-full">
    <CardWithRemove item={item} context={context} index={index} />
    <Container context={context} itemComponent={CardWithRemove} parent={item} />
  </div>
);

const DndContextState = ({
  activeItems,
  context,
  child = false,
}: {
  activeItems: IDraggable<DnDValueExample>[];
  context: IDnDContext<DnDValueExample>;
  child?: boolean;
}) => (
  <div className=" tw-content">
    <div
      className={`pl-5 mt-20 border-2 border-gray-200 ${!child ? 'w-100' : 'w-60 border-dashed'}`}
      data-testid="state-bin"
    >
      <h1 className={`mb-4 ${!child ? 'text-xl font-bold' : 'text-sm'}`}>State Items</h1>
      <ul className="mb-8 list-disc ">
        {activeItems.map((item: IDraggable<DnDValueExample>) => (
          <li className="flex items-center gap-10 space-x-3" key={item.id}>
            <span>{context.getDisplayName(item)}</span>
            {item.value.items && (
              <DndContextState
                context={context}
                //@ts-ignore
                activeItems={item.value.items.filter(v => v)}
                child
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  </div>
);
const DnDClient = ({ items, type, itemComponent }: any) => {
  const dndContext = useDnDContext(type, { getDisplayName: sampleDefaultName }, items, sourceItems);

  return (
    <div className="tw-content">
      <div className="gap-8 pl-4 lg:grid lg:grid-cols-3 ">
        <div data-testid="active-bin" className="col-span-2 ">
          <h1 className="mb-4 text-xl font-bold">Active Items</h1>
          <Container
            className="p-3 mb-2 text-sm"
            context={dndContext}
            itemComponent={itemComponent}
          />
        </div>
        <div className="flex items-center ">
          <div data-testid="available-bin">
            <h2 className="mb-2 text-xl font-bold ">Available Items</h2>
            <DragSource<DnDValueExample> className="p-3 mb-2 text-sm" context={dndContext} />
          </div>
        </div>
      </div>
      <DndContextState context={dndContext} activeItems={dndContext.activeItems} />
    </div>
  );
};

const EditableItem = ({
  dndContext,
  item,
  index,
}: {
  dndContext: IDnDContext<DnDValueExample>;
  item: IDraggable<DnDValueExample>;
  index: number;
}) => {
  const handleChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    dndContext.updateItem({ ...item, value: { ...item.value, name: e.target.value } });
  }, 300);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedChangeHandler = useCallback(handleChange, [item, dndContext]);

  return (
    <input
      id={`name.${index}`}
      defaultValue={dndContext.getDisplayName(item)}
      onChange={debouncedChangeHandler}
      aria-label={dndContext.getDisplayName(item)}
    />
  );
};
const DnDClientWithForm = ({ items, type }: any) => {
  const dndContext = useDnDContext(type, { getDisplayName: sampleDefaultName }, items, sourceItems);

  return (
    <>
      <div className="tw-content">
        <div className="gap-8 lg:grid lg:grid-cols-3 ">
          <div data-testid="active-bin" className="col-span-2 ">
            <h1 className="mb-4 text-xl font-bold">Active Items</h1>
            <ul>
              {dndContext.activeItems.map((item: IDraggable<DnDValueExample>, index: number) => (
                <DraggableItem
                  item={{ ...item, container: 'root' }}
                  key={item.id}
                  index={index}
                  className="flex flex-row gap-3 p-3 align-middle "
                  context={dndContext}
                  container="root"
                >
                  <EditableItem
                    key={`input_${item.id}`}
                    dndContext={dndContext}
                    item={item}
                    index={index}
                  />
                </DraggableItem>
              ))}
            </ul>
            <DropZone type={dndContext.type} context={dndContext} name="root" />
          </div>
          <div className="flex items-center ">
            <div data-testid="available-bin">
              <h2 className="mb-4 text-xl font-bold ">Available Items</h2>
              <DragSource className="mb-4 text-sm" context={dndContext} />
            </div>
          </div>
        </div>
      </div>
      <DndContextState context={dndContext} activeItems={dndContext.activeItems} />
    </>
  );
};

export type { DnDValueExample };
export {
  DnDClientWithForm,
  DnDClient,
  CardWithDnD,
  CardWithRemove,
  sourceItems,
  sampleDefaultName,
};
