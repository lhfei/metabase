import styled from "@emotion/styled";
import type { KeyboardEvent } from "react";
import { forwardRef, useCallback, useEffect, useRef } from "react";
import { usePrevious } from "react-use";

import { TreeNode } from "metabase/components/tree/TreeNode";
import type { TreeNodeProps } from "metabase/components/tree/types";
import CollectionDropTarget from "metabase/containers/dnd/CollectionDropTarget";
import { getCollectionIcon } from "metabase/entities/collections/utils";
import * as Urls from "metabase/lib/urls";
import { PLUGIN_COLLECTIONS } from "metabase/plugins";
import { Icon } from "metabase/ui";
import type { Collection } from "metabase-types/api";

import { SidebarAddButton } from "./SidebarAddButton";
import {
  CollectionNodeRoot,
  ExpandToggleButton,
  FullWidthLink,
  NameContainer,
  SidebarIcon,
} from "./SidebarItems.styled";

// const AddButton = styled.button`
//   margin-left: auto;
//   margin-right: 8px;
//   background: transparent;
//   border: none;
//   color: #1a7dd7;
//   cursor: pointer;
//   font-size: 12px;
//   padding: 2px 6px;
//   border-radius: 3px;
//   opacity: 0;
//   transition: opacity 0.2s;
//   pointer-events: none;
// `;

const CollectionNodeRootWithAdd = styled(CollectionNodeRoot)<{
  isSelected?: boolean;
}>`
  ${props =>
    props.isSelected &&
    `
      button {
        opacity: 1;
        pointer-events: auto;
      }
    `}
`;
// const CollectionNodeRootWithAdd = styled(CollectionNodeRoot)<{
//   isSelected?: boolean;
// }>`
//   &:hover ${AddButton} {
//     opacity: 1;
//     pointer-events: auto;
//   }
//   ${props =>
//     props.isSelected &&
//     `
//       ${AddButton} {
//         opacity: 1;
//         pointer-events: auto;
//       }
//     `}
// `;

type DroppableProps = {
  hovered: boolean;
  highlighted: boolean;
};

type Props = DroppableProps &
  Omit<TreeNodeProps, "item"> & {
    collection: Collection;
    withAdd?: boolean;
    onAddClick?: () => void;
  };

const TIME_BEFORE_EXPANDING_ON_HOVER = 600;

const SidebarCollectionLink = forwardRef<HTMLLIElement, Props>(
  function SidebarCollectionLink(
    {
      collection,
      hovered: isHovered,
      depth,
      onSelect,
      isExpanded,
      isSelected,
      hasChildren,
      withAdd,
      onToggleExpand,
      onAddClick,
    }: Props,
    ref,
  ) {
    const wasHovered = usePrevious(isHovered);
    const timeoutId = useRef<number>();

    useEffect(() => {
      const justHovered = !wasHovered && isHovered;

      if (justHovered && !isExpanded) {
        timeoutId.current = window.setTimeout(() => {
          if (isHovered) {
            onToggleExpand();
          }
        }, TIME_BEFORE_EXPANDING_ON_HOVER);
      }

      return () => clearTimeout(timeoutId.current);
    }, [wasHovered, isHovered, isExpanded, onToggleExpand]);

    const url = Urls.collection(collection);

    const onKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (!hasChildren) {
          return;
        }
        switch (event.key) {
          case "ArrowRight":
            !isExpanded && onToggleExpand();
            break;
          case "ArrowLeft":
            isExpanded && onToggleExpand();
            break;
        }
      },
      [isExpanded, hasChildren, onToggleExpand],
    );

    const icon = getCollectionIcon(collection);
    const isRegularCollection = PLUGIN_COLLECTIONS.isRegularCollection(
      collection as unknown as Collection,
    );

    const handleAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      // console.log(collection)
      onAddClick?.();
    };

    return (
      <CollectionNodeRootWithAdd
        role="treeitem"
        depth={depth}
        aria-selected={isSelected}
        isSelected={isSelected}
        hovered={isHovered}
        onClick={onToggleExpand}
        hasDefaultIconStyle={isRegularCollection}
        ref={ref}
      >
        <ExpandToggleButton hidden={!hasChildren}>
          <TreeNode.ExpandToggleIcon
            isExpanded={isExpanded}
            name="chevronright"
            size={12}
          />
        </ExpandToggleButton>
        <FullWidthLink to={url} onClick={onSelect} onKeyDown={onKeyDown}>
          <TreeNode.IconContainer transparent={false}>
            <SidebarIcon {...icon} isSelected={isSelected} />
          </TreeNode.IconContainer>
          <NameContainer>{collection.name}</NameContainer>
        </FullWidthLink>
        {withAdd && (
          // <AddButton onClick={handleAddClick}>
          //   <Icon name="add" tooltip="新集合" />
          // </AddButton>
          <SidebarAddButton
            icon="add"
            onClick={handleAddClick}
            tooltip="新集合"
          />
        )}
      </CollectionNodeRootWithAdd>
    );
  },
);

const DroppableSidebarCollectionLink = forwardRef<HTMLLIElement, TreeNodeProps>(
  function DroppableSidebarCollectionLink(
    { item, ...props }: TreeNodeProps,
    ref,
  ) {
    const collection = item as unknown as Collection;
    return (
      <div data-testid="sidebar-collection-link-root">
        <CollectionDropTarget collection={collection}>
          {(droppableProps: DroppableProps) => (
            <SidebarCollectionLink
              {...props}
              {...droppableProps}
              collection={collection}
              ref={ref}
              withAdd
            />
          )}
        </CollectionDropTarget>
      </div>
    );
  },
);

export const DroppableSidebarCollectionLink2 = forwardRef<
  HTMLLIElement,
  TreeNodeProps
>(function DroppableSidebarCollectionLink(
  { item, ...props }: TreeNodeProps,
  ref,
) {
  const collection = item as unknown as Collection;
  return (
    <div data-testid="sidebar-collection-link-root">
      <CollectionDropTarget collection={collection}>
        {(droppableProps: DroppableProps) => (
          <SidebarCollectionLink
            {...props}
            {...droppableProps}
            collection={collection}
            ref={ref}
          />
        )}
      </CollectionDropTarget>
    </div>
  );
});

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default DroppableSidebarCollectionLink;
