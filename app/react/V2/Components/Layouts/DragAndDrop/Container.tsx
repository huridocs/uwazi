import React from 'react';
import type { FC } from 'react';
import { IDraggable } from 'app/V2/shared/types';
import { IDnDContext } from 'app/V2/CustomHooks';
import { DraggableItem } from './DraggableItem';
import { DropZone } from './DropZone';

interface IItemComponentProps<T> {
  item: IDraggable<T>;
  context: IDnDContext<T>;
  index: number;
}

interface ContainerProps<T> {
  context: IDnDContext<T>;
  itemComponent?: FC<IItemComponentProps<T>>;
  iconHandle?: boolean;
  className?: string;
  parent?: IDraggable<T>;
}

// eslint-disable-next-line prettier/prettier
const Container = <T, >({
  context,
  iconHandle = false,
  itemComponent,
  className,
  parent,
}: ContainerProps<T>) => {
  const currentItems = parent ? parent.value.items || [] : context.activeItems;
  return (
    <div className="tw-content " data-testid="active_filters_root">
      <div className={`${className}`} style={{ overflow: 'hidden', clear: 'both' }}>
        <ul>
          {currentItems
            .filter((item: IDraggable<T>) => item)
            .map((item: IDraggable<T>, index: number) => (
              <DraggableItem
                item={item}
                key={item.id}
                iconHandle={iconHandle}
                index={index}
                className="flex flex-row gap-3 align-middle "
                context={context}
                container="root"
              >
                <>
                  {itemComponent && itemComponent({ item, context, index })}
                  {!itemComponent && context.getDisplayName(item)}
                </>
              </DraggableItem>
            ))}
        </ul>
        <DropZone
          type={context.type}
          context={context}
          parent={parent}
          name={parent === undefined ? 'root' : `group_${context.getDisplayName(parent)}`}
        />
      </div>
    </div>
  );
};

Container.defaultProps = {
  iconHandle: false,
  itemComponent: undefined,
  className: '',
  parent: undefined,
};

export type { IItemComponentProps };
export { Container };
