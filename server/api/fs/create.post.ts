import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  try {
    return await fsService.create(
      body.name,
      body.type,
      body.content_json ?? body.content ?? '',
      body.parentId || null
    );
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});