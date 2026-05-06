/** 虚拟文件系统路径工具 */

export interface VfsNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: VfsNode[];
  source?: 'worldbook' | 'character' | 'preset';
  meta?: Record<string, any>;
}

/** 将扁平路径列表构建为树形结构 */
export function buildTree(paths: { path: string; source: VfsNode['source']; meta?: Record<string, any> }[]): VfsNode[] {
  const root: VfsNode[] = [];

  for (const item of paths) {
    const parts = item.path.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const fullPath = '/' + parts.slice(0, i + 1).join('/');

      let existing = current.find(n => n.name === name);
      if (!existing) {
        existing = {
          name,
          path: fullPath,
          type: isLast ? 'file' : 'folder',
          source: item.source,
          meta: isLast ? item.meta : undefined,
          children: isLast ? undefined : [],
        };
        current.push(existing);
      }
      if (!isLast) {
        if (!existing.children) existing.children = [];
        if (existing.type !== 'folder') existing.type = 'folder';
        current = existing.children;
      }
    }
  }

  sortTree(root);
  return root;
}

/** 递归排序：文件夹在前，文件在后，同类型按名称排序 */
function sortTree(nodes: VfsNode[]) {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  for (const node of nodes) {
    if (node.children) sortTree(node.children);
  }
}

/** 从路径中提取文件名 */
export function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

/** 从路径中提取父级路径 */
export function dirname(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

/** 规范化路径 */
export function normalizePath(path: string): string {
  return '/' + path.split('/').filter(Boolean).join('/');
}
