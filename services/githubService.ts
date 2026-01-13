import { FileNode } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Helper to parse "user/repo" from URL or string
export const parseRepoString = (input: string): { owner: string; repo: string } | null => {
  try {
    const cleaned = input.replace(/\/$/, '').replace('.git', '');
    if (cleaned.startsWith('http')) {
      const url = new URL(cleaned);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    } else {
      const parts = cleaned.split('/');
      if (parts.length === 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    }
  } catch (e) {
    console.error("Error parsing repo string", e);
  }
  return null;
};

export const fetchRepoStructure = async (
  owner: string,
  repo: string,
  token?: string
): Promise<FileNode[]> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  // 1. Get default branch sha
  const repoRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers });
  if (!repoRes.ok) throw new Error(`Repo not found or inaccessible: ${repoRes.statusText}`);
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  // 2. Get recursive tree
  const treeRes = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    { headers }
  );
  if (!treeRes.ok) throw new Error('Failed to fetch file tree');
  
  const treeData = await treeRes.json();
  
  // Filter for blobs (files) only, limit to reasonable size to prevent browser crash
  // We exclude images and large binaries by extension for the context
  return (treeData.tree as FileNode[]).filter(node => node.type === 'blob');
};

export const fetchFileContent = async (
  url: string,
  token?: string
): Promise<string> => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3.raw', // Request raw content
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch file content');
  return await res.text();
};

// Unicode-safe Base64 encoder
const toBase64 = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
  return btoa(binString);
};

export const updateFile = async (
  owner: string,
  repo: string,
  path: string,
  content: string,
  sha: string,
  message: string,
  token: string
): Promise<void> => {
  if (!token) throw new Error("Token is required to save changes");

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;
  const body = {
    message,
    content: toBase64(content),
    sha
  };

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update file');
  }
};

const TEXT_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.py', '.rb', '.java', '.c', '.cpp', '.h', '.cs', 
  '.go', '.rs', '.php', '.html', '.css', '.json', '.md', '.txt', '.yml', '.yaml', 
  '.toml', '.xml', '.gradle', '.properties', '.sql', '.sh', '.bat', '.dockerfile'
];

export const isTextFile = (path: string): boolean => {
  const lower = path.toLowerCase();
  // Check typical text extensions
  if (TEXT_EXTENSIONS.some(ext => lower.endsWith(ext))) return true;
  // Check for specific filenames
  if (['dockerfile', 'makefile', 'license', 'readme', 'changelog'].includes(lower.split('/').pop() || '')) return true;
  return false;
};

export const selectKeyFiles = (files: FileNode[]): FileNode[] => {
  // Simple heuristic: prioritize README, package.json, src files, root config files
  // Limit to ~20 files for demo purposes to avoid hitting API rate limits quickly if unauthenticated
  // In a real app, we might use a smarter selection or backend.
  
  const sorted = [...files].sort((a, b) => {
    const scoreA = getFileScore(a.path);
    const scoreB = getFileScore(b.path);
    return scoreB - scoreA;
  });

  return sorted.slice(0, 30); // Grab top 30 most "relevant" text files
};

const getFileScore = (path: string): number => {
  const lower = path.toLowerCase();
  let score = 0;
  
  // Root files are important
  if (!path.includes('/')) score += 10;
  
  // README is critical
  if (lower.includes('readme')) score += 50;
  
  // Config files
  if (lower.endsWith('package.json') || lower.endsWith('tsconfig.json') || lower.endsWith('requirements.txt')) score += 40;
  
  // Source code
  if (lower.startsWith('src/')) score += 20;
  
  // Prefer shorter paths (closer to root)
  score -= path.split('/').length * 2;
  
  // Deprioritize tests slightly for general understanding
  if (lower.includes('test') || lower.includes('spec')) score -= 15;
  
  // Deprioritize massive paths
  if (path.length > 100) score -= 20;

  return score;
};
