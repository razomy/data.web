import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);

  // If pagination parameters are requested, return paginated response
  if (query.page !== undefined || query.pageSize !== undefined) {
    return await fsService.getPaginatedNodes({
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 10,
      search: (query.search as string) || '',
      type: query.type as string | undefined,
      parentId: query.folderId !== undefined ? ((query.folderId as string) || null) : undefined,
      sortBy: (query.sortBy as string) || undefined,
      sortDir: (query.sortDir as 'asc' | 'desc') || 'asc',
    });
  }

  const folderId = (query.folderId as string) || null;
  return await fsService.getChildren(folderId);
});