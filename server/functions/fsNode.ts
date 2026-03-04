import dotenv from 'dotenv';
import {PrismaPg} from '@prisma/adapter-pg';
import {FsNodeType, PrismaClient} from '../../generated/client';
import * as fs from 'node:fs';
import type {FsNodeCreateManyInput} from '~~/generated/models/FsNode';
import * as path from 'node:path';
import {randomUUID} from 'crypto';

// dotenv.config({path: '../../.env'})
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({connectionString});
export const prisma = new PrismaClient({adapter});

// Define this outside to improve performance (reusing the instance)
const encoder = new TextEncoder();

/**
 * Helper function to recursively check if an object contains ANY key
 * with a byte length greater than the maxBytes limit.
 */
function hasChildWithGiantKey(obj: any, maxBytes: number): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  for (const [k, v] of Object.entries(obj)) {
    // Check the current child key
    if (encoder.encode(k).length > maxBytes) {
      return true;
    }
    // Recursively check deeper children
    // if (hasChildWithGiantKey(v, maxBytes)) {
    //   return true;
    // }
  }

  return false;
}

function traverseJsonToDbNodes(
  jsonObject: any,
  parentId: string | null = null,
  ancestors: string[] = []
): FsNodeCreateManyInput[] {
  const results: FsNodeCreateManyInput[] = [];

  if (typeof jsonObject !== 'object' || jsonObject === null) {
    return results;
  }

  for (const [key, value] of Object.entries(jsonObject)) {
    const isValueString = typeof value === 'string';
    const isKeyNotLowercaseAlpha = !/^[a-z._]+$/.test(key);
    const isMaxLength = encoder.encode(key).length > 100; // Your original rule

    // NEW LOGIC: Look ahead to see if children contain a key > 255 bytes
    const containsGiantChildKey = hasChildWithGiantKey(value, 255);

    // If any of these are true, treat the current level as a File
    const isFile = isValueString || isKeyNotLowercaseAlpha || isMaxLength || containsGiantChildKey;

    const type: 'FileJson' | 'Directory' = isFile ? 'FileJson' : 'Directory';
    const id = randomUUID();

    let content_json = '';
    if (isFile) {
      content_json = isValueString
        ? value
        : JSON.stringify(value, null, 2); // Writes the whole object as JSON
    }

    const node: FsNodeCreateManyInput = {
      id,
      name: key,
      type,
      content_json,
      parentId,
      ancestors,
    };

    results.push(node);

    // Only recurse if it's a directory
    if (!isFile && typeof value === 'object' && value !== null) {
      const childAncestors = [...ancestors, id];
      const children = traverseJsonToDbNodes(value, id, childAncestors);
      results.push(...children);
    }
  }

  return results;
}

/**
 * 2. Main function to execute the JSON to Database sync
 */
async function syncJsonToDatabase(jsonFilePath: string) {
  console.log(`Reading JSON from: ${jsonFilePath}...`);

  // Read the JSON file into memory
  const fileContent = fs.readFileSync(jsonFilePath, {encoding: 'utf-8'});
  const json = JSON.parse(fileContent);

  const rootId = randomUUID();

  // Create an artificial root node for the JSON tree
  const rootNode: FsNodeCreateManyInput = {
    id: rootId,
    name: 'company',
    type: 'Directory',
    content_json: '',
    parentId: null,
    ancestors: [],
  };

  // Generate all nodes recursively in memory directly from the JSON
  const childNodes = traverseJsonToDbNodes(json, rootId, [rootId]);

  // Combine root node with all children
  const allNodesToInsert = [rootNode, ...childNodes];
  console.log(`Generated ${allNodesToInsert.length} virtual files and directories in memory.`);

  // 3. Batch Insert into Database
  const BATCH_SIZE = 5000;

  for (let i = 0; i < allNodesToInsert.length; i += BATCH_SIZE) {
    const batch = allNodesToInsert.slice(i, i + BATCH_SIZE);


    // UNCOMMENT WHEN READY TO RUN WITH PRISMA
    // await prisma.fsNode.createMany({
    //   data: batch,
    //   skipDuplicates: true,
    // });


    console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
  }

  console.log('Successfully synced JSON virtual file system to database!');
}

// syncJsonToDatabase('/Volumes/resource/resource/razomy/notation/code/js.chunk/razomy/notation/fs-vrd/all2.json');

/**
 * 1. Recursive function to traverse the filesystem and build an array of objects in memory.
 */
async function traverseFileSystem(
  currentPath: string,
  parentId: string | null = null,
  ancestors: string[] = []
): Promise<FsNodeCreateManyInput[]> {
  const results: FsNodeCreateManyInput[] = [];

  // Read directory contents
  const entries = fs.readdirSync(currentPath, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(currentPath, entry.name);
    const isDirectory = entry.isDirectory();
    const type: FsNodeType = isDirectory ? 'Directory' : 'FileJson'; // Assuming your enum has these

    // Pre-generate the ID so we can assign it to children as their parentId
    // const id = randomUUID();

    // Gather some basic stats to put in content_json
    const stats: fs.Stats = await new Promise(r => fs.stat(fullPath, (e, s) => r(s)));
    const content_json = JSON.stringify({
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension: isDirectory ? null : path.extname(entry.name)
    });
    const id = randomUUID();
    // Create the node object in memory
    const node: FsNodeCreateManyInput = {
      id,
      name: entry.name,
      type,
      content_json,
      parentId,
      ancestors,
    };

    results.push(node);

    // If it's a directory, recursively process its children
    if (isDirectory) {
      // Calculate ancestors for the children (current ancestors + this directory's ID)
      const childAncestors = [...ancestors, id];
      const children = await traverseFileSystem(fullPath, id, childAncestors);

      // Merge children into the results array
      results.push(...children);
    }
  }

  return results;
}

/**
 * 2. Main function to execute the batch request
 */
export async function syncDirectoryToDatabase(rootDirectoryPath: string) {
  console.log(`Scanning directory: ${rootDirectoryPath}...`);
  const rootId = randomUUID();
  // Create an artificial root node for the selected directory
  // const rootId = randomUUID();
  const rootNode: FsNodeCreateManyInput = {
    id: rootId,
    name: path.basename(rootDirectoryPath) || 'root',
    type: 'Directory',
    content_json: JSON.stringify({isRoot: true}),
    parentId: null,
    ancestors: [],
  };

  // Generate all nodes recursively in memory
  const childNodes = await traverseFileSystem(rootDirectoryPath, rootId, [rootId]);

  // Combine root node with all children
  const allNodesToInsert = [rootNode, ...childNodes];
  console.log(`Found ${allNodesToInsert.length} files and directories.`);

  // 3. Batch Insert into Database
  // We chunk the array in case the filesystem is huge (e.g., > 10,000 files)
  // to avoid hitting Postgres parameter limits.
  const BATCH_SIZE = 5000;

  for (let i = 0; i < allNodesToInsert.length; i += BATCH_SIZE) {
    const batch = allNodesToInsert.slice(i, i + BATCH_SIZE);

    await prisma.fsNode.createMany({
      data: batch,
      skipDuplicates: true, // Optional: prevents crashes if a file with same ID somehow exists
    });

    console.log(`Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`);
  }

  console.log('Successfully synced file system to database!');
}


export async function create(name: string, type: FsNodeType, content_json: string, parentId: string | null) {
  let newAncestors: string[] = [];

  // Если файл создается внутри папки, получаем данные родителя
  if (parentId) {
    const parent = await prisma.fsNode.findUnique({
      where: {id: parentId},
      select: {ancestors: true, id: true}
    });

    if (!parent) throw new Error('Родительская папка не найдена');

    // Добавляем ID родителя в конец массива его предков
    newAncestors = [...parent.ancestors, parent.id];
  }

  // Создаем файл
  return await prisma.fsNode.create({
    data: {
      name,
      type,
      content_json,
      parentId,
      ancestors: newAncestors,
    },
  });
}

export async function getChildren(folderId: string) {
  return await prisma.fsNode.findMany({
    where: {parentId: folderId}
  });
}

export async function getChildrenRecursive(folderId: string) {
  return await prisma.fsNode.findMany({
    where: {
      ancestors: {
        has: folderId // Ищет все строки, где folderId есть в массиве ancestors
      }
    }
  });
}

export async function move(nodeId: string, newParentId: string | null) {
  // 1. Получаем перемещаемый узел
  const nodeToMove = await prisma.fsNode.findUnique({
    where: { id: nodeId },
    select: { ancestors: true, type: true }
  });
  if (!nodeToMove) throw new Error('Файл/папка не найдены');

  // 2. Вычисляем новые ancestors
  let newAncestors: string[] = [];
  if (newParentId) {
    const newParent = await prisma.fsNode.findUnique({
      where: { id: newParentId },
      select: { ancestors: true, id: true }
    });
    if (!newParent) throw new Error('Новая родительская папка не найдена');

    if (newParent.ancestors.includes(nodeId) || newParent.id === nodeId) {
      throw new Error('Нельзя переместить папку саму в себя или в свою подпапку');
    }

    newAncestors = [...newParent.ancestors, newParent.id];
  }

  // 3. Для обычного файла просто обновляем его
  if (nodeToMove.type === FsNodeType.FileJson) {
    return await prisma.fsNode.update({
      where: { id: nodeId },
      data: { parentId: newParentId, ancestors: newAncestors }
    });
  }

  // 4. ДЛЯ ПАПКИ: Транзакция с высокопроизводительным BULK UPDATE
  const oldAncestorsLength = nodeToMove.ancestors.length;
  // Сразу формируем префикс для всех потомков: (новые предки + сама папка)
  const newPrefix = [...newAncestors, nodeId];

  await prisma.$transaction(async (tx) => {
    // 4.1 Обновляем саму перемещаемую папку (1 быстрый запрос)
    await tx.fsNode.update({
      where: { id: nodeId },
      data: { parentId: newParentId, ancestors: newAncestors }
    });

    // 4.2 Обновляем ВСЕХ потомков ОДНИМ запросом на стороне БД (без цикла в Node.js!)
    // Заменяем срез [start:end] на комбинацию unnest + array_agg.
    await tx.$executeRaw`
      UPDATE fs_node
      SET ancestors = ${newPrefix}::uuid[] || 
                      COALESCE(
                        (
                          SELECT array_agg(elem ORDER BY ord)
                          FROM unnest(ancestors) WITH ORDINALITY AS a(elem, ord)
                          WHERE ord > ${oldAncestorsLength + 1}
                        ),
                        ARRAY[]::uuid[]
                      )
      WHERE ancestors @> ARRAY[${nodeId}::uuid];
    `;
  }, {timeout:30000});

  return true;
}

export async function rename(id: string, newName: string) {
  // Дополнительно здесь можно добавить проверку,
  // нет ли уже файла с таким именем в этой папке (об этом ниже)
  return await prisma.fsNode.update({
    where: {id},
    data: {name: newName},
  });
}

export async function delete_(id: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Сначала удаляем всех потомков (файлы и папки внутри) на любой глубине.
    // Если мы удаляем просто файл, этот запрос ничего не найдет и просто пройдет мимо.
    await tx.fsNode.deleteMany({
      where: {
        ancestors: {
          has: id, // Находим всё, где удаляемый ID числится в предках
        },
      },
    });

    // 2. Затем удаляем саму папку/файл
    return await tx.fsNode.delete({
      where: {id},
    });
  }, {timeout: 15000,});
}

export async function getBreadcrumbs(nodeId: string) {
  const node = await prisma.fsNode.findUnique({
    where: {id: nodeId},
    select: {ancestors: true, name: true, id: true}
  });

  if (!node) return [];

  // Если файл в корне, у него нет предков
  if (node.ancestors.length === 0) return [node.name];

  // Получаем имена всех предков
  const ancestors = await prisma.fsNode.findMany({
    where: {id: {in: node.ancestors}},
    select: {id: true, name: true}
  });

  // ВАЖНО: База данных не гарантирует порядок при IN (...).
  // Нам нужно отсортировать предков в том порядке, в котором они лежат в массиве node.ancestors
  const sortedAncestors = node.ancestors.map(
    (id) => ancestors.find((a) => a.id === id)
  );

  return [...sortedAncestors, {id: node.id, name: node.name}];
}

export async function saveContent(id: string, content_json: string) {
  return await prisma.fsNode.update({
    where: {id},
    data: {content_json},
  });
}
