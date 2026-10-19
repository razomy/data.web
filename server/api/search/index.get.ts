import { mockOrm } from '../../functions/mockOrm';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);

  return await mockOrm.entityRow.searchEntities({
    query: (query.q as string) || '',
    type: (query.type as string) || 'All',
    sortBy: (query.sortBy as 'relevance' | 'name' | 'fields') || 'relevance',
    page: query.page ? Number(query.page) : 1,
    pageSize: query.pageSize ? Number(query.pageSize) : 20,
  });
});