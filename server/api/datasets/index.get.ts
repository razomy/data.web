import { mockOrm } from '../../db/mockOrm.ts';
import { cookieVerifyOrThrow } from '../../functions/cookieVerifyOrThrow';

export default defineEventHandler(async (event) => {
  await cookieVerifyOrThrow(event);
  const [datasets, authors] = await Promise.all([
    mockOrm.catalog.getDatasets(),
    mockOrm.catalog.getAuthors(),
  ]);
  return {
    datasets,
    authors,
  };
});
