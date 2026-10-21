import { mockOrm } from './mockOrm';
import { FsNodeType } from '~/razomy/abstractions/graph';
import type { FsNodeRecord, PaginatedResult } from '~/razomy/abstractions/graph';

export async function create(
  name: string,
  type: FsNodeType,
  content_json: string,
  parentId: string | null
): Promise<FsNodeRecord> {
  return await mockOrm.fsNode.create({
    name,
    type,
    content_json,
    parentId,
  });
}

export async function getChildren(folderId: string | null): Promise<FsNodeRecord[]> {
  return await mockOrm.fsNode.findMany({
    where: { parentId: folderId || null },
  });
}

export async function getPaginatedNodes(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string | number;
  parentId?: string | null;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<PaginatedResult<FsNodeRecord>> {
  return await mockOrm.fsNode.paginate(params);
}

export async function getChildrenRecursive(folderId: string): Promise<FsNodeRecord[]> {
  return await mockOrm.fsNode.findMany({
    where: { ancestorsHas: folderId },
  });
}

export async function move(nodeId: string, newParentId: string | null): Promise<FsNodeRecord> {
  const nodeToMove = await mockOrm.fsNode.findUnique(nodeId);
  if (!nodeToMove) {
    throw new Error('File or folder not found');
  }

  let newAncestors: string[] = [];
  if (newParentId) {
    const newParent = await mockOrm.fsNode.findUnique(newParentId);
    if (!newParent) {
      throw new Error('Target parent folder not found');
    }
    if (newParent.type !== FsNodeType.Directory) {
      throw new Error('Target destination must be a folder');
    }
    if (newParent.ancestors.includes(nodeId) || newParent.id === nodeId) {
      throw new Error('Cannot move a folder into itself or its subfolder');
    }
    newAncestors = [...newParent.ancestors, newParent.id];
  }

  const updated = await mockOrm.fsNode.update(nodeId, {
    parentId: newParentId || null,
    ancestors: newAncestors,
  });

  if (nodeToMove.type === FsNodeType.Directory) {
    const descendants = await getChildrenRecursive(nodeId);
    const oldPrefixLen = nodeToMove.ancestors.length + 1;
    const newPrefix = [...newAncestors, nodeId];

    for (const desc of descendants) {
      const tail = desc.ancestors.slice(oldPrefixLen);
      await mockOrm.fsNode.update(desc.id, {
        ancestors: [...newPrefix, ...tail],
      });
    }
  }

  return updated;
}

export async function rename(id: string, newName: string): Promise<FsNodeRecord> {
  if (!newName || !newName.trim()) {
    throw new Error('Name cannot be empty');
  }
  return await mockOrm.fsNode.update(id, { name: newName.trim() });
}

export async function delete_(id: string): Promise<boolean> {
  return await mockOrm.fsNode.delete(id);
}

export async function getBreadcrumbs(
  nodeId: string | null
): Promise<{ id: string; name: string }[]> {
  if (!nodeId) return [];
  const node = await mockOrm.fsNode.findUnique(nodeId);
  if (!node) return [];

  if (node.ancestors.length === 0) {
    return [{ id: node.id, name: node.name }];
  }

  const ancestors = await mockOrm.fsNode.findMany({
    where: { idIn: node.ancestors },
  });

  const sortedAncestors = node.ancestors
    .map(id => ancestors.find(a => a.id === id))
    .filter((a): a is FsNodeRecord => Boolean(a))
    .map(a => ({ id: a.id, name: a.name }));

  return [...sortedAncestors, { id: node.id, name: node.name }];
}

export async function saveContent(id: string, content_json: string): Promise<FsNodeRecord> {
  return await mockOrm.fsNode.update(id, { content_json });
}
