import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const body = await readBody(event);
  return await fsService.delete_(body.id);
});