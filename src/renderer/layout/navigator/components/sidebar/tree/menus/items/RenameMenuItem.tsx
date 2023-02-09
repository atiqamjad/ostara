import { useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { NodeApi } from 'react-arborist';
import { TreeItem } from 'renderer/layout/navigator/components/sidebar/tree/tree';
import CustomMenuItem from 'renderer/components/menu/item/CustomMenuItem';
import { showUpdateItemDialog } from 'renderer/utils/dialogUtils';
import { ItemRO } from '../../../../../../../definitions/daemon';

type RenameMenuItemProps = {
  item: ItemRO;
  node?: NodeApi<TreeItem>;
  onClose?: () => void;
};

export default function RenameMenuItem({ item, node, onClose }: RenameMenuItemProps) {
  const renameHandler = useCallback(async (): Promise<void> => {
    onClose?.();

    if (node) {
      await node.edit();
    } else {
      await showUpdateItemDialog(item);
    }
  }, [item, node, onClose]);

  return (
    <CustomMenuItem icon={'TextFieldsOutlined'} text={<FormattedMessage id={'rename'} />} onClick={renameHandler} />
  );
}
