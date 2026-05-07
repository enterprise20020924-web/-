import { type VfsNode } from '../utils/path-utils';
import { buildFullTree, readVfsFile, type VfsFileContent } from '../utils/vfs-adapter';

export const useFileSystemStore = defineStore('fileSystem', () => {
  const tree = ref<VfsNode[]>([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const expandedPaths = ref<Set<string>>(new Set());
  /** 当前选中的文件/文件夹路径 */
  const selectedPath = ref<string | null>(null);
  /** 当前选中的节点 */
  const selectedNode = ref<VfsNode | null>(null);
  /** 是否显示操作菜单 */
  const showActionMenu = ref(false);

  async function refresh() {
    loading.value = true;
    try {
      tree.value = await buildFullTree();
    } catch (e) {
      console.error('[IDE] File tree refresh failed:', e);
    } finally {
      loading.value = false;
    }
  }

  function toggleExpand(path: string) {
    if (expandedPaths.value.has(path)) {
      expandedPaths.value.delete(path);
    } else {
      expandedPaths.value.add(path);
    }
  }

  function isExpanded(path: string): boolean {
    return expandedPaths.value.has(path);
  }

  /** 选中一个节点 */
  function selectNode(node: VfsNode) {
    selectedPath.value = node.path;
    selectedNode.value = node;
    showActionMenu.value = true;
  }

  /** 取消选中 */
  function clearSelection() {
    showActionMenu.value = false;
  }

  const filteredTree = computed(() => {
    if (!searchQuery.value.trim()) return tree.value;
    return filterNodes(tree.value, searchQuery.value.toLowerCase());
  });

  function filterNodes(nodes: VfsNode[], query: string): VfsNode[] {
    const result: VfsNode[] = [];
    for (const node of nodes) {
      if (node.name.toLowerCase().includes(query)) {
        result.push(node);
      } else if (node.children) {
        const filtered = filterNodes(node.children, query);
        if (filtered.length > 0) {
          result.push({ ...node, children: filtered });
        }
      }
    }
    return result;
  }

  async function readFile(node: VfsNode): Promise<VfsFileContent | null> {
    if (node.type !== 'file' || !node.source) return null;
    return readVfsFile(node.path, node.source, node.meta);
  }

  return {
    tree,
    loading,
    searchQuery,
    expandedPaths,
    selectedPath,
    selectedNode,
    showActionMenu,
    filteredTree,
    refresh,
    toggleExpand,
    isExpanded,
    selectNode,
    clearSelection,
    readFile,
  };
});
