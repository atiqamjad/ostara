import { CreateHandler, DeleteHandler, MoveHandler, RenameHandler, Tree, TreeApi } from 'react-arborist';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import NavigatorTreeNode from 'renderer/layout/navigator/components/sidebar/tree/NavigatorTreeNode';
import { TreeItem } from 'renderer/layout/navigator/components/sidebar/tree/tree';
import { NAVIGATOR_ITEM_HEIGHT } from 'renderer/constants/ui';
import { experimentalStyled as styled } from '@mui/material/styles';
import { FormattedMessage } from 'react-intl';
import { useNavigatorTree } from 'renderer/contexts/NavigatorTreeContext';
import { useUpdateItem } from 'renderer/apis/item/updateItem';
import { useDeleteItem } from 'renderer/apis/item/deleteItem';
import { showDeleteConfirmationDialog } from 'renderer/utils/dialogUtils';
import { useMoveItem } from 'renderer/apis/item/moveItem';
import NiceModal from '@ebay/nice-modal-react';
import CreateInstanceDialog from 'renderer/components/item/dialogs/create/CreateInstanceDialog';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { getItemType, getItemUrl, isApplication, isFolder, isInstance } from 'renderer/utils/itemUtils';
import { OpenMap } from 'react-arborist/src/state/open-slice';
import { InstanceRO } from '../../../../../../common/generated_definitions';
import { ItemRO } from '../../../../../definitions/daemon';
import { ItemType } from '../../../../../../infra/configuration/model/configuration';

const TreeStyle = styled(Tree<TreeItem>)(({ theme }) => ({
  '& [role="treeitem"]': {
    outline: 'none',
  },
}));

type NavigatorTreeProps = {
  width: number;
  search?: string;
};

export default function NavigatorTree({ width, search }: NavigatorTreeProps) {
  const { data, isLoading, isEmpty, hasData, action, getItem } = useNavigatorTree();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const treeRef = useRef<TreeApi<TreeItem> | null>(null);

  useEffect(() => {
    const listEl = treeRef.current?.listEl?.current;
    if (listEl) {
      // Solves the bug where the scrollbar is showing on search
      listEl.style.overflow = 'hidden';
    }
  }, [hasData]);

  const getOpenItemsCount = useCallback((): number => {
    if (!data) {
      return 0;
    }

    const treeApi = treeRef.current;
    if (!treeApi) {
      return data.length;
    }

    const sizeHelper = (treeItem: TreeItem): number =>
      1 +
      (treeApi.isOpen(treeItem.id) ? treeItem.children?.map((t) => sizeHelper(t)).reduce((a, b) => a + b, 0) ?? 0 : 0);

    return data.map((treeItem) => sizeHelper(treeItem)).reduce((a, b) => a + b, 0);
  }, [data]);

  const [toggleFlag, setToggleFlag] = useState<number>(0);

  useEffect(() => {
    setToggleFlag((prevToggleFlag) => prevToggleFlag + 1);
  }, [data, search]);

  useEffect(() => {
    if (!action) {
      return;
    }

    switch (action) {
      case 'collapseAll':
        treeRef.current?.closeAll();
        break;
      case 'expandAll':
        treeRef.current?.openAll();
        break;
      default:
        break;
    }

    setToggleFlag((prevToggleFlag) => prevToggleFlag + 1);
  }, [action]);

  const height = useMemo<number>(() => getOpenItemsCount() * NAVIGATOR_ITEM_HEIGHT + 12, [toggleFlag, data]);
  const initialOpenState = useMemo<OpenMap>(() => {
    const openMap: OpenMap = {};
    const checkItemOpen = (item: TreeItem): boolean => {
      if (matchPath({ path: getItemUrl(item), end: false }, pathname)) {
        return true;
      }
      if (item.children?.some(checkItemOpen)) {
        openMap[item.id] = true;
        return true;
      }
      return false;
    };

    for (const item of data ?? []) {
      if (checkItemOpen(item)) {
        break;
      }
    }

    return openMap;
  }, [data]);

  const createInstanceHandler = useCallback(async (): Promise<void> => {
    const instance = await NiceModal.show<InstanceRO | undefined>(CreateInstanceDialog, {});
    if (instance) {
      navigate(getItemUrl(instance));
    }
  }, []);

  const onCreate: CreateHandler<TreeItem> = useCallback(({ parentId, index, parentNode, type }) => {
    return null;
  }, []);

  const updateItemState = useUpdateItem();

  const updateItem = useCallback(
    async (item: ItemRO): Promise<ItemRO | undefined> => {
      try {
        return await updateItemState.mutateAsync({ item });
      } catch (e) {}
      return undefined;
    },
    [updateItemState]
  );

  const moveItemState = useMoveItem();

  const moveItem = useCallback(
    async (id: string, type: ItemType, parentId: string | undefined, sort: number): Promise<ItemRO | undefined> => {
      try {
        return await moveItemState.mutateAsync({ id, type, parentId, sort });
      } catch (e) {}
      return undefined;
    },
    [moveItemState]
  );

  const deleteItemState = useDeleteItem();

  const deleteItem = useCallback(
    async (item: ItemRO): Promise<void> => {
      try {
        await deleteItemState.mutateAsync({ item });
      } catch (e) {}
    },
    [deleteItemState]
  );

  const onRename: RenameHandler<TreeItem> = useCallback(
    ({ id, name, node }) => {
      const item = getItem(id);
      if (!item) {
        return;
      }
      if (item.alias === name) {
        return;
      }
      updateItem({ ...item, alias: name });
    },
    [getItem]
  );

  const onMove: MoveHandler<TreeItem> = useCallback(
    ({ parentId, index, parentNode, dragNodes, dragIds }) => {
      if (parentNode && isInstance(parentNode.data)) {
        // TODO: Show snackbar
        console.log('Cannot move to instance');
        return;
      }

      if (dragNodes.some((node) => isInstance(node.data)) && dragNodes.some((node) => !isInstance(node.data))) {
        // TODO: Show snackbar
        console.log('Cannot mix instances and non-instances');
        return;
      }

      if (dragNodes.some((node) => isInstance(node.data)) && (!parentNode || !isApplication(parentNode.data))) {
        // TODO: Show snackbar
        console.log("Cannot move instance to item that isn't application");
        return;
      }

      if (dragNodes.some((node) => isApplication(node.data)) && parentNode && !isFolder(parentNode.data)) {
        // TODO: Show snackbar
        console.log("Cannot move application to item that isn't folder");
        return;
      }

      const children = parentNode?.children?.map((c) => c.data) ?? data;
      const beforeSort = children?.[index - 1]?.sort;
      const afterSort = children?.[index]?.sort;

      dragNodes.forEach((node, nodeIndex, array) => {
        const item = node.data;

        let newSort: number;
        if (beforeSort && afterSort) {
          newSort = beforeSort + ((afterSort - beforeSort) / (array.length + 1)) * (nodeIndex + 1);
        } else if (beforeSort) {
          newSort = beforeSort + nodeIndex + 1;
        } else if (afterSort) {
          newSort = (afterSort / (array.length + 1)) * (nodeIndex + 1);
        } else {
          newSort = nodeIndex + 1;
        }

        moveItem(item.id, getItemType(item), parentId || undefined, newSort);
      });
    },
    [data]
  );

  const onDelete: DeleteHandler<TreeItem> = useCallback(async ({ ids, nodes }): Promise<void> => {
    const items = nodes.map((node) => node.data);
    const confirm = await showDeleteConfirmationDialog(items);
    if (!confirm) {
      return;
    }
    items.forEach((item) => deleteItem(item));
  }, []);

  const onToggle = useCallback((): void => {
    setToggleFlag((prevToggleFlag) => prevToggleFlag + 1);
  }, []);

  const disableDrop = useCallback((dropItem: TreeItem): boolean => isInstance(dropItem), []);

  return (
    <>
      {isLoading && (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {isEmpty && (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ color: 'text.secondary' }}>
              <FormattedMessage id="addYourFirstInstance" />
            </Typography>
            <Button variant="outlined" color="primary" size={'small'} onClick={createInstanceHandler}>
              <FormattedMessage id={'createInstance'} />
            </Button>
          </Box>
        </Box>
      )}

      {hasData && (
        <TreeStyle
          ref={treeRef}
          idAccessor={'id'}
          data={data}
          openByDefault={false}
          initialOpenState={initialOpenState}
          width={width}
          height={height}
          indent={12}
          rowHeight={NAVIGATOR_ITEM_HEIGHT}
          searchTerm={search}
          searchMatch={(node, term) => node.data.alias.toLowerCase().includes(term.toLowerCase())}
          onCreate={onCreate}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onToggle={onToggle}
          disableDrop={disableDrop}
        >
          {NavigatorTreeNode}
        </TreeStyle>
      )}
    </>
  );
}
