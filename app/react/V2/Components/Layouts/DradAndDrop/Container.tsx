import type { FC } from 'react';
import React, { memo } from 'react';
import { IDraggable } from 'app/V2/shared/types';
import { IDnDContext } from 'app/V2/CustomHooks';
import { DraggableItem } from './DraggableItem';
import { DropZone } from './DropZone';

interface IItemComponentProps {
  item: IDraggable;
  context: IDnDContext;
  index: number;
}

interface ContainerProps {
  context: IDnDContext;
  itemComponent?: FC<IItemComponentProps>;
  iconHandle?: boolean;
  name?: string;
  className?: string;
  parent?: IDraggable;
}

const Container: FC<ContainerProps> = memo(
  ({
    name = 'container',
    context,
    iconHandle = false,
    itemComponent,
    className,
    parent,
  }: ContainerProps) => {
    const currentItems = parent ? parent.items || [] : context.activeItems;
    return (
      <div className="tw-content ">
        <div className={`${className}`} style={{ overflow: 'hidden', clear: 'both' }}>
          <ul>
            {currentItems
              .filter(item => item)
              .map(item => ({ ...item, container: name }))
              .map((item: IDraggable, index: number) => (
                <DraggableItem
                  item={item}
                  key={item.name}
                  iconHandle={iconHandle}
                  index={index}
                  className="flex flex-row gap-3 align-middle "
                  context={context}
                >
                  <>
                    {itemComponent && itemComponent({ item, context, index })}
                    {!itemComponent && item.name}
                  </>
                </DraggableItem>
              ))}
          </ul>
          <DropZone type={context.type} name={name} context={context} parent={parent} />
        </div>
      </div>
    );
  }
);

Container.defaultProps = {
  iconHandle: false,
  itemComponent: undefined,
  className: '',
  name: 'root',
  parent: undefined,
};

export type { IItemComponentProps };
export { Container };
