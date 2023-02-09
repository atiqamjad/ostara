import React, { FunctionComponent, useCallback, useMemo } from 'react';
import Page from 'renderer/components/layout/Page';
import { useNavigatorTree } from 'renderer/contexts/NavigatorTreeContext';
import TableComponent from 'renderer/components/table/TableComponent';
import { Entity } from 'renderer/entity/entity';
import { Card } from '@mui/material';
import { instanceLoggerEntity } from 'renderer/entity/entities/instanceLogger.entity';
import { EnrichedInstanceLogger, useGetInstanceLoggersQuery } from 'renderer/apis/instance/getInstanceLoggers';
import { useSetInstanceLoggerLevel } from 'renderer/apis/instance/setInstanceLoggerLevel';
import { RESET_ID } from 'renderer/entity/actions';
import { LoggerCustomFilters } from 'renderer/components/item/logger/LoggerCustomFiltersComponent';
import { InstanceRO } from '../../../../../common/generated_definitions';

const InstanceLoggers: FunctionComponent = () => {
  const { selectedItem } = useNavigatorTree();

  const item = useMemo<InstanceRO>(() => selectedItem as InstanceRO, [selectedItem]);

  const entity = useMemo<Entity<EnrichedInstanceLogger, LoggerCustomFilters>>(() => instanceLoggerEntity, []);
  const queryState = useGetInstanceLoggersQuery({ instanceId: item.id });

  const setLevelState = useSetInstanceLoggerLevel();

  const actionsHandler = useCallback(async (actionId: string, row: EnrichedInstanceLogger): Promise<void> => {
    switch (actionId) {
      case RESET_ID:
        setLevelState.mutate({ instanceId: row.instanceId, loggerName: row.name, level: undefined });
        break;
      default:
        break;
    }
  }, []);

  const massActionsHandler = useCallback(
    async (actionId: string, selectedRows: EnrichedInstanceLogger[]): Promise<void> => {},
    []
  );

  const globalActionsHandler = useCallback(async (actionId: string): Promise<void> => {}, []);

  return (
    <Page>
      <Card>
        <TableComponent
          entity={entity}
          queryState={queryState}
          actionsHandler={actionsHandler}
          massActionsHandler={massActionsHandler}
          globalActionsHandler={globalActionsHandler}
        />
      </Card>
    </Page>
  );
};

export default InstanceLoggers;
