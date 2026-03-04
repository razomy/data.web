import * as fsService from '../../functions/fsNode';
import {cookieVerifyOrThrow} from '#server/functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  const decodedClaims = await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  return await fsService.saveContent(body.id, body.content_json);
});