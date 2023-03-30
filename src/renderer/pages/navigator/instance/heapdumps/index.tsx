import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import Page from 'renderer/components/layout/Page';
import { useNavigatorTree } from 'renderer/contexts/NavigatorTreeContext';
import TableComponent from 'renderer/components/table/TableComponent';
import { Entity } from 'renderer/entity/entity';
import { Card } from '@mui/material';
import {
  InstanceHealthChangedEventMessage$Payload,
  InstanceHeapdumpDownloadProgressMessage$Payload,
  InstanceHeapdumpReferenceRO,
  InstanceRO,
} from '../../../../../common/generated_definitions';
import { instanceHeapdumpReferencesEntity } from '../../../../entity/entities/instanceHeapdumpReferences.entity';
import { useGetInstanceHeapdumpReferencesQuery } from '../../../../apis/requests/instance/heapdumps/getInstanceHeapdumpReferences';
import { DELETE_ID, DOWNLOAD_ID, REQUEST_ID } from '../../../../entity/actions';
import { FormattedMessage } from 'react-intl';
import { useRequestInstanceHeapdump } from '../../../../apis/requests/instance/heapdumps/requestInstanceHeapdump';
import { useSnackbar } from 'notistack';
import { useDeleteInstanceHeapdumpReference } from '../../../../apis/requests/instance/heapdumps/deleteInstanceHeapdumpReference';
import { useDownloadInstanceHeapdumpReference } from '../../../../apis/requests/instance/heapdumps/downloadInstanceHeapdumpReference';
import { useStomp } from '../../../../apis/websockets/StompContext';

const InstanceHeapdumpReferences: FunctionComponent = () => {
  const { selectedItem } = useNavigatorTree();
  const { subscribe } = useStomp();
  const { enqueueSnackbar } = useSnackbar();

  const item = useMemo<InstanceRO>(() => selectedItem as InstanceRO, [selectedItem]);

  const entity = useMemo<Entity<InstanceHeapdumpReferenceRO>>(() => instanceHeapdumpReferencesEntity, []);
  const queryState = useGetInstanceHeapdumpReferencesQuery({ instanceId: item.id });

  const [data, setData] = useState<InstanceHeapdumpReferenceRO[] | undefined>(undefined);
  const loading = useMemo<boolean>(() => !data, [data]);

  useEffect(() => {
    setData(queryState.data);
  }, [queryState.data]);

  useEffect(() => {
    const unsubscribe = subscribe(
      '/topic/instanceHeapdumpDownloadProgress',
      {},
      (downloadChanged: InstanceHeapdumpDownloadProgressMessage$Payload): void => {
        setData((prev) =>
          prev?.map((h) =>
            h.id === downloadChanged.referenceId
              ? { ...h, status: downloadChanged.status, error: downloadChanged.error, size: downloadChanged.bytesRead }
              : h
          )
        );
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  const downloadHeapdumpState = useDownloadInstanceHeapdumpReference();
  const deleteHeapdumpState = useDeleteInstanceHeapdumpReference();

  const actionsHandler = useCallback(async (actionId: string, row: InstanceHeapdumpReferenceRO): Promise<void> => {
    switch (actionId) {
      case DOWNLOAD_ID:
        try {
          await downloadHeapdumpState.mutateAsync({ reference: row });
        } catch (e) {
          enqueueSnackbar(<FormattedMessage id={'heapdumpDownloadFailed'} />, {
            variant: 'error',
          });
        }
        break;
      case DELETE_ID:
        try {
          await deleteHeapdumpState.mutateAsync({ instanceId: row.instanceId, referenceId: row.id });
        } catch (e) {}
        break;
      default:
        break;
    }
  }, []);

  const massActionsHandler = useCallback(
    async (actionId: string, selectedRows: InstanceHeapdumpReferenceRO[]): Promise<void> => {},
    []
  );

  const requestHeapdumpState = useRequestInstanceHeapdump();
  const globalActionsHandler = useCallback(async (actionId: string): Promise<void> => {
    switch (actionId) {
      case REQUEST_ID:
        try {
          await requestHeapdumpState.mutateAsync({ instanceId: item.id });
          enqueueSnackbar(<FormattedMessage id={'heapdumpRequestedSuccessfully'} />, {
            variant: 'success',
          });
        } catch (e) {}
        break;
      default:
        break;
    }
  }, []);

  return (
    <Page>
      <Card>
        <TableComponent
          entity={entity}
          data={data}
          loading={loading}
          refetchHandler={queryState.refetch}
          actionsHandler={actionsHandler}
          massActionsHandler={massActionsHandler}
          globalActionsHandler={globalActionsHandler}
        />
      </Card>
    </Page>
  );
};

export default InstanceHeapdumpReferences;
