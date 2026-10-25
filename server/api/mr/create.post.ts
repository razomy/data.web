import { mockOrm } from '../../db/mockOrm.ts';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  try {
    return await mockOrm.mergeRequest.create({
      title: body.title,
      description: body.description || '',
      sourceBranch: body.sourceBranch,
      targetType: body.targetType || 'entity',
      targetId: body.targetId,
      authorId: body.authorId,
      changes: body.changes || [],
      proposedJsonContent: body.proposedJsonContent,
    });
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});
