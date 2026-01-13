export interface FileNode {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface RepoContext {
  owner: string;
  name: string;
  description?: string;
  files: Map<string, string>; // path -> content
  structure: FileNode[]; // Changed from string[] to FileNode[] to keep SHAs available
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  IMPORTING = 'IMPORTING',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface ImportConfig {
  repoUrl: string;
  githubToken?: string;
}

export type Tab = 'chat' | 'code' | 'github';