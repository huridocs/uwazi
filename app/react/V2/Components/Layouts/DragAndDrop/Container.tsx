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
  name?: string;
  className?: string;
  parent?: IDraggable<T>;
}

// eslint-disable-next-line react/function-component-definition
function Container<T>({
  name = 'container',
  context,
  iconHandle = false,
  itemComponent,
  className,
  parent,
}: ContainerProps<T>) {
  const currentItems = parent ? parent.value.items || [] : context.activeItems;
  return (
    <div className="tw-content " data-testid={`active_filters_${name}`}>
      <div className={`${className}`} style={{ overflow: 'hidden', clear: 'both' }}>
        <ul>
          {currentItems
            .filter((item: IDraggable<T>) => item)
            .map((item: IDraggable<T>) => ({ ...item, container: name }))
            .map((item: IDraggable<T>, index: number) => (
              <DraggableItem
                item={item}
                key={item.id}
                iconHandle={iconHandle}
                index={index}
                className="flex flex-row gap-3 align-middle "
                context={context}
              >
                <>
                  {itemComponent && itemComponent({ item, context, index })}
                  {!itemComponent && context.getDisplayName(item)}
                </>
              </DraggableItem>
            ))}
        </ul>
        <DropZone type={context.type} name={name} context={context} parent={parent} />
      </div>
    </div>
  );
}
Container.defaultProps = {
  iconHandle: false,
  itemComponent: undefined,
  className: '',
  name: 'root',
  parent: undefined,
};

export type { IItemComponentProps };
export { Container };
