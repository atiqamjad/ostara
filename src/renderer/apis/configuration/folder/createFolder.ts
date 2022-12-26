import { EnrichedFolder, Folder } from 'infra/configuration/model/configuration';
import { BaseMutationOptions, BaseUseMutationResult, useBaseMutation } from 'renderer/apis/base/useBaseMutation';
import { configurationKeys } from 'renderer/apis/configuration/configurationKeys';

type Variables = {
  item: Omit<Folder, 'id' | 'type'>;
};

type Data = EnrichedFolder;

export const createFolder = async (variables: Variables): Promise<Data> => {
  return await window.configuration.createFolder(variables.item);
};

export const useCreateFolder = (
  options?: BaseMutationOptions<Data, Variables>
): BaseUseMutationResult<Data, Variables> =>
  useBaseMutation<Data, Variables>(createFolder, {
    ...options,
    invalidateQueriesKeyFn: (data, variables) => configurationKeys.items(),
  });
