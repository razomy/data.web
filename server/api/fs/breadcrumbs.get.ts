import * as fsService from '../../functions/fsNode';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const query = getQuery(event);
  const folderId = (query.id as string) || null;
  return await fsService.getBreadcrumbs(folderId);
});