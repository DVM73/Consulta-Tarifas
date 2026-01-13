import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Check } from 'lucide-react';

interface CodeEditorProps {
  path: string;
  initialContent: string;
  sha: string;
  onSave: (path: string, content: string, sha: string, message: string) => Promise<void>;
  isSaving: boolean;
  hasToken: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  path, 
  initialContent, 
  sha,
  onSave, 
  isSaving,
  hasToken
}) => {
  const [content, setContent] = useState(initialContent);
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  
  useEffect(() => {
    setContent(initialContent);
    setShowCommitInput(false);
    setCommitMessage(`Update ${path}`);
  }, [path, initialContent]);

  const handleSaveClick = () => {
    if (!hasToken) return;
    setShowCommitInput(true);
  };

  const confirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage) return;
    await onSave(path, content, sha, commitMessage);
    setShowCommitInput(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Editor Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <span className="font-mono text-sm text-slate-300">{path}</span>
        
        <div className="flex items-center gap-2">
           {!hasToken && (
             <div className="flex items-center gap-1 text-xs text-amber-500 mr-2">
               <AlertCircle className="w-3 h-3" />
               <span>Sin Token (Solo lectura)</span>
             </div>
           )}
           <button
             onClick={handleSaveClick}
             disabled={isSaving || !hasToken || content === initialContent}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
               ${isSaving || !hasToken || content === initialContent
                 ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                 : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20'}`}
           >
             {isSaving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
             <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
           </button>
        </div>
      </div>

      {/* Commit Dialog Overlay */}
      {showCommitInput && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={confirmSave} className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-6 animate-fadeIn">
             <h3 className="text-lg font-bold text-white mb-4">Confirmar Cambios</h3>
             <div className="mb-4">
               <label className="block text-xs text-slate-400 mb-1">Mensaje del Commit</label>
               <input 
                  type="text" 
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none"
                  autoFocus
               />
             </div>
             <div className="flex justify-end gap-3">
               <button 
                type="button"
                onClick={() => setShowCommitInput(false)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700"
               >
                 Cancelar
               </button>
               <button 
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 font-medium"
               >
                 Commit & Push
               </button>
             </div>
          </form>
        </div>
      )}

      {/* Simple Textarea Editor */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full bg-slate-950 text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none"
          spellCheck={false}
          disabled={!hasToken && false} // Let them type but not save if no token
        />
      </div>
    </div>
  );
};
