import { mockOrm } from '../../functions/mockOrm';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  try {
    return await mockOrm.mergeRequest.review({
      mrId: body.mrId,
      action: body.action,
      reviewerId: body.reviewerId,
      comment: body.comment,
    });
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err.message });
  }
});