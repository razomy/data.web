import { mockOrm } from '../../functions/mockOrm';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Entity ID is required' });
  }

  const entity = await mockOrm.entityRow.findEntityById(id);
  if (!entity) {
    throw createError({ statusCode: 404, statusMessage: `Entity "${id}" not found` });
  }

  const subgraph = await mockOrm.graph.getSubgraph(entity.id);
  return {
    entity,
    subgraph,
  };
});