import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { Fragment, useCallback, useMemo, useState } from 'react';
import {
  AgentModifyRequestRO,
  AgentRO,
  ApplicationMetricRuleCreateRequestRO,
  ApplicationModifyRequestRO,
  ApplicationRO,
  FolderModifyRequestRO,
  FolderRO,
  InstanceModifyRequestRO,
  InstanceRO,
} from 'common/generated_definitions';
import { useNavigatorLayoutContext } from 'renderer/contexts/NavigatorLayoutContext';
import { INHERITED_COLOR_VALUE } from 'renderer/hooks/items/useItemColor';
import { applicationCrudEntity } from 'renderer/apis/requests/crud/entity/entities/application.crudEntity';
import { instanceCrudEntity } from 'renderer/apis/requests/crud/entity/entities/instance.crudEntity';
import { crudKeys } from 'renderer/apis/requests/crud/crudKeys';
import { useCrudCreate } from 'renderer/apis/requests/crud/crudCreate';
import { useCrudCreateBulk } from 'renderer/apis/requests/crud/crudCreateBulk';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from '@mui/lab';
import { Authentication$Typed } from 'common/manual_definitions';
import { useGetApplicationsHealth } from 'renderer/apis/requests/application/health/getApplicationsHealth';
import { useDeleteItem } from 'renderer/apis/requests/item/deleteItem';
import { folderCrudEntity } from 'renderer/apis/requests/crud/entity/entities/folder.crudEntity';
import { showDeleteItemConfirmationDialog } from 'renderer/utils/dialogUtils';
import { isItemDeletable } from 'renderer/utils/itemUtils';
import { useCreateApplicationMetricRule } from 'renderer/apis/requests/application/metric-rules/createApplicationMetricRule';
import { useSettingsContext } from 'renderer/contexts/SettingsContext';
import { agentCrudEntity } from 'renderer/apis/requests/crud/entity/entities/agent.crudEntity';

type ApplicationToCreate = {
  folderName?: string;
  applicationName: string;
  instances: string[];
  authentication?: Authentication$Typed;
  metricRule?: Omit<ApplicationMetricRuleCreateRequestRO, 'applicationId'>;
};

type AgentToCreate = {
  folderName?: string;
  agentName: string;
  url: string;
  authentication?: Authentication$Typed;
};

type HomeDeveloperModeProps = {};

export default function HomeDeveloperMode({}: HomeDeveloperModeProps) {
  const { notificationsSoundActive } = useSettingsContext();
  const { data, getNewItemOrder } = useNavigatorLayoutContext();
  const queryClient = useQueryClient();

  const testApplications = useMemo<ApplicationToCreate[]>(
    () => [
      {
        folderName: 'Flyway',
        applicationName: 'Flyway',
        instances: [
          'https://sbclient.krud.dev/first/1/actuator',
          'https://sbclient.krud.dev/first/2/actuator',
          'https://sbclient.krud.dev/first/3/actuator',
        ],
      },
      {
        applicationName: 'Liquibase',
        instances: [
          'https://sbclient.krud.dev/second/1/actuator',
          'https://sbclient.krud.dev/second/2/actuator',
          'https://sbclient.krud.dev/second/3/actuator',
        ],
        metricRule: {
          name: 'CPU usage > 90%',
          metricName: {
            name: 'process.cpu.usage',
            statistic: 'VALUE',
            tags: {},
          },
          type: 'SIMPLE',
          operation: 'GREATER_THAN',
          value1: 0.9,
          enabled: true,
        },
      },
      {
        applicationName: 'Secure',
        instances: [
          'https://sbclient.krud.dev/third/1/actuator',
          'https://sbclient.krud.dev/third/2/actuator',
          'https://sbclient.krud.dev/third/3/actuator',
        ],
        authentication: {
          type: 'basic',
          username: 'user',
          password: 'user',
        },
      },
      {
        applicationName: 'Daemon',
        instances: [`${window.daemonAddress}/actuator`],
      },
    ],
    []
  );

  const testAgents = useMemo<AgentToCreate[]>(
    () => [
      {
        folderName: 'Agents',
        agentName: 'Local Agent',
        url: 'http://localhost:14444/',
      },
    ],
    []
  );

  const [loading, setLoading] = useState<boolean>(false);

  const createFolderState = useCrudCreate<FolderRO, FolderModifyRequestRO>({ refetchNone: true });
  const createApplicationState = useCrudCreate<ApplicationRO, ApplicationModifyRequestRO>({ refetchNone: true });
  const createBulkInstanceState = useCrudCreateBulk<InstanceRO, InstanceModifyRequestRO>({ refetchNone: true });
  const createAgentState = useCrudCreate<AgentRO, AgentModifyRequestRO>({ refetchNone: true });
  const createMetricRuleState = useCreateApplicationMetricRule();

  const createApplicationsHandler = useCallback(
    async (itemsToCreate: ApplicationToCreate[]): Promise<void> => {
      setLoading(true);

      try {
        let itemSort = getNewItemOrder();
        for (const itemToCreate of itemsToCreate) {
          const folder = itemToCreate.folderName
            ? await createFolderState.mutateAsync({
                entity: folderCrudEntity,
                item: {
                  alias: itemToCreate.folderName,
                  color: INHERITED_COLOR_VALUE,
                  authentication: { type: 'inherit' },
                  sort: itemSort,
                },
              })
            : undefined;

          const applicationToCreate: ApplicationModifyRequestRO = {
            alias: itemToCreate.applicationName,
            type: 'SPRING_BOOT',
            parentFolderId: folder?.id,
            sort: itemSort,
            color: INHERITED_COLOR_VALUE,
            authentication: itemToCreate.authentication ?? { type: 'inherit' },
          };

          itemSort += 1;

          const application = await createApplicationState.mutateAsync({
            entity: applicationCrudEntity,
            item: applicationToCreate,
          });

          const instanceSort = 1;
          const actuatorUrls = itemToCreate.instances;
          const instancesToCreate = actuatorUrls.map<InstanceModifyRequestRO>((actuatorUrl, index) => ({
            alias: undefined,
            actuatorUrl,
            parentApplicationId: application.id,
            sort: instanceSort + index,
            color: INHERITED_COLOR_VALUE,
            icon: undefined,
          }));

          await createBulkInstanceState.mutateAsync({
            entity: instanceCrudEntity,
            items: instancesToCreate,
          });

          if (itemToCreate.metricRule) {
            await createMetricRuleState.mutateAsync({
              metricRule: { ...itemToCreate.metricRule, applicationId: application.id },
            });
          }
        }

        queryClient.invalidateQueries(crudKeys.entity(folderCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(applicationCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(instanceCrudEntity));
      } catch (e) {
      } finally {
        setLoading(false);
      }
    },
    [getNewItemOrder]
  );

  const createAgentsHandler = useCallback(
    async (itemsToCreate: AgentToCreate[]): Promise<void> => {
      setLoading(true);

      try {
        let itemSort = getNewItemOrder();
        for (const itemToCreate of itemsToCreate) {
          const folder = itemToCreate.folderName
            ? await createFolderState.mutateAsync({
                entity: folderCrudEntity,
                item: {
                  alias: itemToCreate.folderName,
                  color: INHERITED_COLOR_VALUE,
                  authentication: { type: 'inherit' },
                  sort: itemSort,
                },
              })
            : undefined;

          const agentToCreate: AgentModifyRequestRO = {
            name: itemToCreate.agentName,
            url: itemToCreate.url,
            parentFolderId: folder?.id,
            sort: itemSort,
            color: INHERITED_COLOR_VALUE,
            authentication: itemToCreate.authentication ?? { type: 'inherit' },
          };

          itemSort += 1;

          const agent = await createAgentState.mutateAsync({
            entity: agentCrudEntity,
            item: agentToCreate,
          });
        }

        queryClient.invalidateQueries(crudKeys.entity(folderCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(agentCrudEntity));
      } catch (e) {
      } finally {
        setLoading(false);
      }
    },
    [getNewItemOrder]
  );

  const createTestInstancesHandler = useCallback(async (): Promise<void> => {
    await createApplicationsHandler(testApplications);
  }, [createApplicationsHandler, testApplications]);

  const createManyInstancesHandler = useCallback(async (): Promise<void> => {
    await createApplicationsHandler([
      {
        applicationName: 'Many',
        instances: [
          'https://sbclient.krud.dev/first/1/actuator',
          'https://sbclient.krud.dev/first/2/actuator',
          'https://sbclient.krud.dev/first/3/actuator',
        ].flatMap((el) => new Array(66).fill(el)),
      },
    ]);
  }, [createApplicationsHandler, testApplications]);

  const createTestAgentsHandler = useCallback(async (): Promise<void> => {
    await createAgentsHandler(testAgents);
  }, [createAgentsHandler, testAgents]);

  const deleteItemState = useDeleteItem({ refetchNone: true });

  const deleteAllHandler = useCallback(async (): Promise<void> => {
    if (!data) {
      return;
    }

    const confirm = await showDeleteItemConfirmationDialog(data);
    if (!confirm) {
      return;
    }

    setLoading(true);

    try {
      const promises = data
        .filter((item) => isItemDeletable(item))
        .map((itemToDelete) =>
          deleteItemState.mutateAsync({
            item: itemToDelete,
          })
        );
      const result = await Promise.all(promises);
      if (result) {
        queryClient.invalidateQueries(crudKeys.entity(folderCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(applicationCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(instanceCrudEntity));
        queryClient.invalidateQueries(crudKeys.entity(agentCrudEntity));
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [data, deleteItemState]);

  const applicationsHealthState = useGetApplicationsHealth();

  const logApplicationsHealthHandler = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const result = await applicationsHealthState.mutateAsync({});
      console.log('Applications Health', result);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [applicationsHealthState]);

  const sendTestNotificationHandler = useCallback(async (): Promise<void> => {
    await window.notifications.sendNotification({
      title: 'Test Notification Title',
      body: 'Test notification body text',
      silent: !notificationsSoundActive,
    });
  }, [notificationsSoundActive]);

  return (
    <Card sx={{ flexGrow: 1, minHeight: 300 }}>
      <CardContent>
        <Typography variant={'h6'} gutterBottom>
          Developer Mode &#x1F913;
        </Typography>

        <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>
          Electron: {JSON.stringify(window.isElectron)}
        </Typography>

        {testApplications.map((itemToCreate) => (
          <Fragment key={itemToCreate.applicationName}>
            <Typography variant={'subtitle2'} sx={{ mt: 1 }}>
              {itemToCreate.applicationName}
            </Typography>
            {itemToCreate.instances.map((instance) => (
              <Typography variant={'body2'} sx={{ color: 'text.secondary' }} key={instance}>
                {instance}
              </Typography>
            ))}
          </Fragment>
        ))}

        <Typography variant={'subtitle2'} sx={{ mt: 1 }}>
          Swagger API Documentation
        </Typography>
        <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>
          http://localhost:12222/swagger-ui/index.html
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
          <LoadingButton variant="outlined" color="primary" loading={loading} onClick={createTestInstancesHandler}>
            Create Test Instances
          </LoadingButton>
          <LoadingButton variant="outlined" color="primary" loading={loading} onClick={createManyInstancesHandler}>
            Create Many Instances
          </LoadingButton>
          <LoadingButton variant="outlined" color="primary" loading={loading} onClick={createTestAgentsHandler}>
            Create Test Agents
          </LoadingButton>
          <LoadingButton variant="outlined" color="error" loading={loading} onClick={deleteAllHandler}>
            Delete All
          </LoadingButton>
          <LoadingButton variant="outlined" color="primary" onClick={sendTestNotificationHandler}>
            Send Test Notification
          </LoadingButton>
          <LoadingButton variant="outlined" color="primary" loading={loading} onClick={logApplicationsHealthHandler}>
            Log Applications Health
          </LoadingButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
