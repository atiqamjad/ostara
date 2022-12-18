export type ApplicationType = 'SpringBoot';

type Item = Instance | Application | Folder;
export type BaseItem = {
  id: string;
  type: 'folder' | 'application' | 'instance';
};

export type HierarchicalItem = BaseItem & {
  parentFolderId?: string;
};

export type OrderedItem = BaseItem & {
  order?: number;
};

export type Instance = OrderedItem & {
  type: 'instance';
  parentApplicationId: string;
  alias: string;
  actuatorUrl: string;
};

export type Application = HierarchicalItem &
  OrderedItem & {
    type: 'application';
    applicationType: ApplicationType;
    alias: string;
    description?: string;
    icon?: string;
  };

export type Folder = HierarchicalItem &
  OrderedItem & {
    type: 'folder';
    alias: string;
    description?: string;
    icon?: string;
  };

export type Configuration = {
  items: { [key: string]: Item };
};

export function isApplication(item: BaseItem): item is Application {
  return item.type === 'application';
}

export function isFolder(item: BaseItem): item is Folder {
  return item.type === 'folder';
}

export function isInstance(item: BaseItem): item is Instance {
  return item.type === 'instance';
}
