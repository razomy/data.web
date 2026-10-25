import {Pool} from 'pg';
import {createDbContext} from "@razomy/cloud-db-pg/data";
import {snakeCase} from "@razomy/string-case";

// 1. Создаем стандартный пул pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default defineEventHandler(async (event) => {

// 2. Инжектим пул в наш автосгенерированный контекст

  // async function main() {
  //   // А. Создание и мгновенный INSERT в базу (возвращает Proxy-объект с заполненными created_at/updated_at из БД!)
  //   const domain = await db.domain.insert({
  //     domain: 'google.com',
  //     type: 'generic',
  //     tldManager: 'Charleston Road Registry Inc.',
  //   });
  //
  //   console.log('Создан домен в БД:', domain.createdAt);
  //
  //   // Б. Поиск по Primary Key (SELECT * FROM domain WHERE domain = $1)
  //   const found = await db.domain.findByPk('google.com');
  //   if (!found) return;
  //
  //   // В. Меняем поля как у обычного JS-объекта!
  //   found.tldManager = 'Alphabet Inc.';
  //
  //   // Proxy сам знает, что изменилось только поле tld_manager, и у него внутри уже лежит наш pg.Pool!
  //   // Вызываем $save() — он выполнит: UPDATE domain SET tld_manager = $1 WHERE domain = $2 RETURNING *;
  //   await found.$save();
  //
  //   // Если вызвать $save() второй раз подряд без изменений — он НЕ сделает лишний запрос в БД!
  //   await found.$save();
  //
  //   // Г. Работа с транзакциями (DI автоматически подменяет Pool на транзакционный Client!)
  //   await db.$transaction(pool, async (tx) => {
  //     const media = await tx.media.insert({
  //       extension: 'png',
  //       mimeType: 'image/png',
  //       category: 'image',
  //       isBinary: true,
  //     });
  //
  //     media.category = 'raster_image';
  //     await media.$save(); // Выполнится внутри открытой транзакции tx!
  //   });
  // }

  // await cookieVerifyOrThrow(event);

  // return await mockOrm.entityRow.searchEntities({
  //   query: (query.q as string) || '',
  //   type: (query.type as string) || 'All',
  //   sortBy: (query.sortBy as 'relevance' | 'name' | 'fields') || 'relevance',
  //   page: query.page ? Number(query.page) : 1,
  //   pageSize: query.pageSize ? Number(query.pageSize) : 20,
  // });

  const db = createDbContext(pool);
  const query = getQuery(event);
  const name = snakeCase(query.name as string);
  const found = await db[name].findMany();
  return {nodes: found.map((i) => i.$toJson())};
});
