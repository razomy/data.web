import { mockOrm } from '../../db/mockOrm.ts';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  return await mockOrm.graph.getGlobalGraph();
});
