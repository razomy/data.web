import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);

  return await fsService.getPaginatedNodes({
    page: query.page ? Number(query.page) : 1,
    pageSize: query.pageSize ? Number(query.pageSize) : 10,
    search: (query.search as string) || '',
    type: query.type as string | undefined,
    sortBy: (query.sortBy as string) || 'name',
    sortDir: (query.sortDir as 'asc' | 'desc') || 'asc',
  });
});