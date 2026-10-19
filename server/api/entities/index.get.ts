import { mockOrm } from '../../functions/mockOrm';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);

  return await mockOrm.entityRow.paginate({
    page: query.page ? Number(query.page) : 1,
    pageSize: query.pageSize ? Number(query.pageSize) : 100,
    type: (query.type as string) || 'All',
    search: (query.search as string) || '',
    sortBy: (query.sortBy as string) || '_idx',
    sortDir: (query.sortDir as 'asc' | 'desc') || 'asc',
  });
});