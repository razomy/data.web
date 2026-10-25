import { mockOrm } from '../../db/mockOrm.ts';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);
  const status = (query.status as string) || 'all';
  return await mockOrm.mergeRequest.list(status);
});
