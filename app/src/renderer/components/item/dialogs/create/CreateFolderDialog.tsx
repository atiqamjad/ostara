import { FormattedMessage } from 'react-intl';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Dialog } from '@mui/material';
import NiceModal, { NiceModalHocProps, useModal } from '@ebay/nice-modal-react';
import DialogTitleEnhanced from 'renderer/components/dialog/DialogTitleEnhanced';
import FolderDetailsForm, { FolderFormValues } from 'renderer/components/item/dialogs/forms/FolderDetailsForm';
import { FolderModifyRequestRO, FolderRO } from 'common/generated_definitions';
import { useCrudCreate } from 'renderer/apis/requests/crud/crudCreate';
import { folderCrudEntity } from 'renderer/apis/requests/crud/entity/entities/folder.crudEntity';
import { INHERITED_COLOR_VALUE } from 'renderer/hooks/items/useItemColor';
import { useAnalyticsContext } from 'renderer/contexts/AnalyticsContext';
import { getItemUrl } from 'renderer/utils/itemUtils';
import { useItemsContext } from 'renderer/contexts/ItemsContext';
import { useNavigate } from 'react-router-dom';

export type CreateFolderDialogProps = {
  parentFolderId?: string;
  sort?: number;
  onCreated?: (items: FolderRO[]) => void;
} & NiceModalHocProps;

const CreateFolderDialog: FunctionComponent<CreateFolderDialogProps> = NiceModal.create(
  ({ parentFolderId, sort, onCreated }) => {
    const modal = useModal();
    const { track } = useAnalyticsContext();
    const { addItem } = useItemsContext();
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState<boolean>(false);

    const createState = useCrudCreate<FolderRO, FolderModifyRequestRO>({ refetchNone: true });

    const submitHandler = useCallback(
      async (data: FolderFormValues): Promise<void> => {
        setSubmitting(true);

        const itemToCreate: FolderModifyRequestRO = {
          alias: data.alias,
          parentFolderId: parentFolderId,
          sort: sort ?? 1,
          color: data.color ?? INHERITED_COLOR_VALUE,
          icon: data.icon,
          authentication: data.authentication,
        };
        try {
          const result = await createState.mutateAsync({ entity: folderCrudEntity, item: itemToCreate });
          if (result) {
            track({ name: 'add_folder' });

            addItem(result);
            navigate(getItemUrl(result));

            onCreated?.([result]);

            modal.resolve(result);
            await modal.hide();
          }
        } catch (e) {
        } finally {
          setSubmitting(false);
        }
      },
      [parentFolderId, sort, onCreated, createState, modal]
    );

    const cancelHandler = useCallback((): void => {
      if (submitting) {
        return;
      }
      modal.resolve(undefined);
      modal.hide();
    }, [submitting, modal]);

    return (
      <Dialog
        open={modal.visible}
        onClose={cancelHandler}
        TransitionProps={{
          onExited: () => modal.remove(),
        }}
        fullWidth
        maxWidth={'xs'}
      >
        <DialogTitleEnhanced disabled={submitting} onClose={cancelHandler}>
          <FormattedMessage id={'createFolder'} />
        </DialogTitleEnhanced>
        <FolderDetailsForm defaultValues={{ parentFolderId }} onSubmit={submitHandler} onCancel={cancelHandler} />
      </Dialog>
    );
  }
);

export default CreateFolderDialog;
