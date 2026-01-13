import React, { useState, useMemo } from 'react';
import { FileNode } from '../types';
import { File, Folder, FolderOpen, FileText, Image, Box, FileCode, Circle } from 'lucide-react';

interface FileExplorerProps {
  files: FileNode[];
  onSelectFile: (file: FileNode) => void;
  selectedPath?: string;
  modifiedFiles?: Set<string>;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  children: Record<string, TreeNode>;
  fileNode?: FileNode;
}

// Helper to build the tree structure from flat file list
const buildTree = (files: FileNode[]): TreeNode => {
  const root: TreeNode = { name: '', path: '', type: 'tree', children: {} };

  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        const isFile = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');
        current.children[part] = {
          name: part,
          path,
          type: isFile ? 'blob' : 'tree',
          children: {},
          fileNode: isFile ? file : undefined
        };
      }
      current = current.children[part];
    });
  });

  return root;
};

const FileIcon = ({ name }: { name: string }) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext || '')) return <Image className="w-4 h-4 text-purple-400" />;
  if (['ts', 'tsx', 'js', 'jsx'].includes(ext || '')) return <FileCode className="w-4 h-4 text-blue-400" />;
  if (['json', 'yml', 'yaml'].includes(ext || '')) return <Box className="w-4 h-4 text-yellow-400" />;
  if (['md', 'txt'].includes(ext || '')) return <FileText className="w-4 h-4 text-slate-400" />;
  
  return <File className="w-4 h-4 text-slate-500" />;
};

const TreeNodeItem: React.FC<{ 
  node: TreeNode; 
  depth: number; 
  onSelect: (node: FileNode) => void;
  selectedPath?: string;
  modifiedFiles?: Set<string>;
}> = ({ node, depth, onSelect, selectedPath, modifiedFiles }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'tree';
  const hasChildren = Object.keys(node.children).length > 0;
  const isSelected = node.path === selectedPath;
  const isModified = modifiedFiles?.has(node.path);

  if (node.name === '') {
    // Root node, just render children
    return (
      <>
        {Object.values(node.children)
          .sort((a, b) => {
             if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
             return a.name.localeCompare(b.name);
          })
          .map(child => (
            <TreeNodeItem 
              key={child.path} 
              node={child} 
              depth={depth} 
              onSelect={onSelect} 
              selectedPath={selectedPath}
              modifiedFiles={modifiedFiles}
            />
          ))}
      </>
    );
  }

  // Check if folder contains modified files (recursive check could be expensive, simplistic visual for now)
  // For now, only files show the dot.

  return (
    <div>
      <div 
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer select-none transition-colors relative
          ${isSelected ? 'bg-blue-600/20 text-blue-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setIsOpen(!isOpen);
          } else if (node.fileNode) {
            onSelect(node.fileNode);
          }
        }}
      >
        <span className="shrink-0 opacity-70">
          {isFolder ? (
            isOpen ? <FolderOpen className="w-4 h-4 text-blue-300" /> : <Folder className="w-4 h-4 text-blue-300" />
          ) : (
            <FileIcon name={node.name} />
          )}
        </span>
        <span className={`text-sm truncate flex-1 ${isSelected ? 'font-medium' : ''}`}>
          {node.name}
        </span>
        {isModified && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500 mr-1" title="Modificado (Sin guardar)" />
        )}
      </div>
      
      {isFolder && isOpen && (
        <div>
          {Object.values(node.children)
            .sort((a, b) => {
               if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
               return a.name.localeCompare(b.name);
            })
            .map(child => (
              <TreeNodeItem 
                key={child.path} 
                node={child} 
                depth={depth + 1} 
                onSelect={onSelect}
                selectedPath={selectedPath}
                modifiedFiles={modifiedFiles}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onSelectFile, selectedPath, modifiedFiles }) => {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="h-full overflow-y-auto bg-slate-950 border-r border-slate-800 flex flex-col w-64 shrink-0">
      <div className="p-3 border-b border-slate-900 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explorador</h3>
        {modifiedFiles && modifiedFiles.size > 0 && (
           <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">
             {modifiedFiles.size} pendientes
           </span>
        )}
      </div>
      <div className="flex-1 py-2">
        <TreeNodeItem 
          node={tree} 
          depth={0} 
          onSelect={onSelectFile} 
          selectedPath={selectedPath}
          modifiedFiles={modifiedFiles}
        />
      </div>
    </div>
  );
};
