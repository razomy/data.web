import * as fsService from '../../functions/fsNode';
import {cookieVerifyOrThrow} from '#server/functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  const decodedClaims = await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  try {
    return await fsService.move(body.nodeId, body.newParentId || null);
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});