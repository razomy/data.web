import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  try {
    return await fsService.rename(body.id, body.newName);
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});