import ContextMenuPopper from 'renderer/components/menu/popup/ContextMenuPopper';
import { TreeItemContextMenuProps } from 'renderer/layout/navigator/components/sidebar/tree/tree';
import DeleteMenuItem from 'renderer/layout/navigator/components/sidebar/tree/menus/items/DeleteMenuItem';
import RenameMenuItem from 'renderer/layout/navigator/components/sidebar/tree/menus/items/RenameMenuItem';
import ChooseColorMenuItem from 'renderer/layout/navigator/components/sidebar/tree/menus/items/ChooseColorMenuItem';
import { Divider } from '@mui/material';
import UpdateMenuItem from 'renderer/layout/navigator/components/sidebar/tree/menus/items/UpdateMenuItem';
import CopyIdToClipboardMenuItem from 'renderer/layout/navigator/components/sidebar/tree/menus/items/CopyIdToClipboardMenuItem';
import { ContextMenuContext } from 'renderer/components/menu/popup/ContextMenuContext';
import React from 'react';

export default function InstanceContextMenu({ item, node, onCreated, ...props }: TreeItemContextMenuProps) {
  return (
    <ContextMenuPopper {...props}>
      <ContextMenuContext.Consumer>
        {({ menuState: { close } }) => (
          <>
            <ChooseColorMenuItem item={item} onClose={close} />
            <Divider />
            <CopyIdToClipboardMenuItem item={item} onClose={close} />
            <UpdateMenuItem item={item} onClose={close} />
            <RenameMenuItem item={item} node={node} onClose={close} />
            <DeleteMenuItem item={item} onClose={close} />
          </>
        )}
      </ContextMenuContext.Consumer>
    </ContextMenuPopper>
  );
}
