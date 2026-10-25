import { mockOrm } from '../../db/mockOrm.ts';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);
  const id = (query.id as string) || 'e1';
  const width = query.width ? Number(query.width) : 420;
  const height = query.height ? Number(query.height) : 260;

  try {
    return await mockOrm.graph.getSubgraph(id, width, height);
  } catch (err: any) {
    throw createError({ statusCode: 404, statusMessage: err.message });
  }
});
