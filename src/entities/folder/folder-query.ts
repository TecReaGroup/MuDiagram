import { queryOptions } from '@tanstack/react-query';
import { listFolders } from './folder-api';

export const folderListQuery = queryOptions({ queryKey: ['folder', 'list'], queryFn: listFolders });
