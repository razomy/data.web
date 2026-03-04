import * as fsService from '../../functions/fsNode';
import {cookieVerifyOrThrow} from '#server/functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  const decodedClaims = await cookieVerifyOrThrow(event);
  const query = getQuery(event);
  const folderId = (query.folderId as string) || null;
  return await fsService.getChildren(folderId!);
});