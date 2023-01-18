export type TaskName =
  | 'queryInstanceMetrics'
  | 'queryInstanceHealth'
  | 'queryInstanceEndpoints'
  | 'downloadPendingHeapdumpReferences';

export type TaskDefinition = {
  alias: string;
  name: TaskName;
  description: string;
  defaultCron: string;
  function: () => Promise<void>;
  runOnStartup?: boolean;
};

export type EffectiveTaskDefinition = TaskDefinition & {
  cron: string;
  active: boolean;
};

export type TaskDefinitionDisplay = Omit<EffectiveTaskDefinition, 'function'> & {
  nextRun: number;
};

declare global {
  export type TaskServiceBridge = {
    getTasksForDisplay: () => Promise<TaskDefinitionDisplay[]>;
    getTaskForDisplay: (name: string) => Promise<TaskDefinitionDisplay | undefined>;
    runTask: (name: TaskName) => Promise<void>;
  };

  interface Window {
    task: TaskServiceBridge;
  }
}

export {};
