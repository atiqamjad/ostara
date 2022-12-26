import { ipcRenderer } from 'electron';
import {
  Application,
  Configuration,
  EnrichedApplication,
  EnrichedFolder,
  EnrichedInstance,
  EnrichedItem,
  Folder,
  Instance,
} from './model/configuration';

export const configurationStoreBridge = {
  get<T>(key: string): T {
    return ipcRenderer.sendSync('configurationStore:get', key);
  },
  set<T>(property: string, val: T) {
    ipcRenderer.send('configurationStore:set', property, val);
  },
  has(key: string): boolean {
    return ipcRenderer.sendSync('configurationStore:has', key);
  },
  delete(key: string): void {
    ipcRenderer.send('configurationStore:delete', key);
  },
  reset(key: string): void {
    ipcRenderer.send('configurationStore:reset', key);
  },
  clear(): void {
    ipcRenderer.send('configurationStore:clear');
  },
};

export const configurationServiceBridge: ConfigurationServiceBridge = {
  getConfiguration(): Promise<Configuration> {
    return ipcRenderer.invoke('configurationService:getConfiguration');
  },
  /**
   * Generic operations
   */
  getItem(id: string): Promise<EnrichedItem | undefined> {
    return ipcRenderer.invoke('configurationService:getItem', id);
  },
  getItems(): Promise<EnrichedItem[]> {
    return ipcRenderer.invoke('configurationService:getItems');
  },
  getItemOrThrow(id: string): Promise<EnrichedItem> {
    return ipcRenderer.invoke('configurationService:getItemOrThrow', id);
  },
  itemExistsOrThrow(id: string): Promise<void> {
    return ipcRenderer.invoke('configurationService:itemExistsOrThrow', id);
  },
  setColor(id: string, color?: string): Promise<void> {
    return ipcRenderer.invoke('configurationService:setColor', id, color);
  },
  /**
   * Folder operations
   */
  createFolder(folder: Omit<Folder, 'id' | 'type'>): Promise<EnrichedFolder> {
    return ipcRenderer.invoke('configurationService:createFolder', folder);
  },
  updateFolder(id: string, folder: Omit<Folder, 'id' | 'type'>): Promise<EnrichedFolder> {
    return ipcRenderer.invoke('configurationService:updateFolder', id, folder);
  },
  deleteFolder(id: string): Promise<void> {
    return ipcRenderer.invoke('configurationService:deleteFolder', id);
  },
  getFolderChildren(id: string): Promise<Exclude<EnrichedItem, EnrichedInstance>[]> {
    return ipcRenderer.invoke('configurationService:getFolderChildren', id);
  },
  moveFolder(id: string, newParentFolderId: string | undefined, newOrder: number): Promise<EnrichedFolder> {
    return ipcRenderer.invoke('configurationService:moveFolder', id, newParentFolderId, newOrder);
  },
  /**
   * Application operations
   */
  createApplication(application: Omit<Application, 'id' | 'type'>): Promise<EnrichedApplication> {
    return ipcRenderer.invoke('configurationService:createApplication', application);
  },
  updateApplication(id: string, application: Omit<Application, 'id' | 'type'>) {
    return ipcRenderer.invoke('configurationService:updateApplication', id, application);
  },
  deleteApplication(id: string): Promise<void> {
    return ipcRenderer.invoke('configurationService:deleteApplication', id);
  },
  moveApplication(id: string, newParentFolderId: string | undefined, newOrder: number): Promise<EnrichedApplication> {
    return ipcRenderer.invoke('configurationService:moveApplication', id, newParentFolderId, newOrder);
  },
  getApplicationInstances(id: string): Promise<EnrichedInstance[]> {
    return ipcRenderer.invoke('configurationService:getApplicationInstances', id);
  },
  /**
   * Instance operations
   */
  createInstance(instance: Omit<Instance, 'id' | 'type'>): Promise<EnrichedInstance> {
    return ipcRenderer.invoke('configurationService:createInstance', instance);
  },
  updateInstance(id: string, instance: Omit<Instance, 'id' | 'type'>): Promise<EnrichedInstance> {
    return ipcRenderer.invoke('configurationService:updateInstance', id, instance);
  },
  deleteInstance(id: string): Promise<void> {
    return ipcRenderer.invoke('configurationService:deleteInstance', id);
  },
  moveInstance(id: string, newParentApplicationId: string, newOrder: number): Promise<EnrichedInstance> {
    return ipcRenderer.invoke('configurationService:moveInstance', id, newParentApplicationId, newOrder);
  },
};
