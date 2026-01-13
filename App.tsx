import React, { useState } from 'react';
import { RepoForm } from './components/RepoForm';
import { ChatInterface } from './components/ChatInterface';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AppState, ImportConfig, Message, RepoContext, Tab, FileNode } from './types';
import { parseRepoString, fetchRepoStructure, selectKeyFiles, fetchFileContent, isTextFile, updateFile } from './services/githubService';
import { geminiService } from './services/geminiService';
import { Terminal, MessageSquare, Code, Layout, Image as ImageIcon, FileWarning, Github, CloudUpload, Check, Bot, FileCode, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [repoContext, setRepoContext] = useState<RepoContext | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [githubToken, setGithubToken] = useState<string>('');

  // Workspace State
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedFileNode, setSelectedFileNode] = useState<FileNode | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Track files modified by AI but not yet saved to GitHub
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());

  const handleImport = async (config: ImportConfig) => {
    try {
      setAppState(AppState.IMPORTING);
      setLoadingStatus('Conectando con GitHub...');
      setError(undefined);
      if (config.githubToken) setGithubToken(config.githubToken);

      const repoInfo = parseRepoString(config.repoUrl);
      if (!repoInfo) {
        throw new Error('URL de repositorio inválida. Usa el formato usuario/repositorio.');
      }

      // 1. Fetch Structure (All files)
      setLoadingStatus('Escaneando estructura completa del proyecto...');
      const allFiles = await fetchRepoStructure(repoInfo.owner, repoInfo.repo, config.githubToken);
      
      // 2. Select Text Files for Context
      setLoadingStatus('Analizando archivos de código para la IA...');
      const textFiles = allFiles.filter(f => isTextFile(f.path));
      const filesToFetch = selectKeyFiles(textFiles);

      // 3. Fetch Content for Initial Context
      setLoadingStatus(`Cargando contexto de ${filesToFetch.length} archivos clave...`);
      const fileContents = new Map<string, string>();
      
      await Promise.all(filesToFetch.map(async (file) => {
        try {
          const content = await fetchFileContent(file.url, config.githubToken);
          fileContents.set(file.path, content);
        } catch (e) {
          console.warn(`Failed to fetch ${file.path}`, e);
        }
      }));

      const context: RepoContext = {
        owner: repoInfo.owner,
        name: repoInfo.repo,
        structure: allFiles,
        files: fileContents
      };

      setRepoContext(context);

      // 4. Initialize Gemini
      setAppState(AppState.ANALYZING);
      setLoadingStatus('Conectando Gemini Pro con tu repositorio...');
      await geminiService.initializeContext(context);

      setAppState(AppState.READY);
      
      setMessages([{
        id: 'init',
        role: 'model',
        content: `¡Conexión restablecida con **${context.owner}/${context.name}**!

He recuperado tu flujo de trabajo:

1. **Pídeme cambios** en el chat (ej: "Añade un console.log en App.tsx").
2. Yo modificaré el archivo.
3. Ve a la pestaña **GitHub** para revisar y desplegar los cambios.`,
        timestamp: Date.now()
      }]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error desconocido al importar el repositorio');
      setAppState(AppState.ERROR);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsSending(true);

    try {
      const responseText = await geminiService.sendMessage(text);
      
      // Automatic File Update Logic
      const fileRegex = /<<<FILE:\s*(.*?)>>>([\s\S]*?)<<<END_FILE>>>/g;
      let match;
      let updatesFound = false;
      const updatedPaths: string[] = [];
      
      let newContextFiles = new Map(repoContext?.files);
      let newStructure = [...(repoContext?.structure || [])];
      let hasNewFiles = false;

      while ((match = fileRegex.exec(responseText)) !== null) {
        updatesFound = true;
        const path = match[1].trim();
        let content = match[2].trim();
        
        content = content.replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '');

        newContextFiles.set(path, content);
        updatedPaths.push(path);

        if (!newStructure.some(f => f.path === path)) {
           newStructure.push({ 
             path, 
             mode: '100644', 
             type: 'blob', 
             sha: 'new',
             url: '', 
             size: content.length 
           });
           hasNewFiles = true;
        }

        if (selectedFileNode?.path === path) {
          setEditorContent(content);
        }
      }

      if (updatesFound && repoContext) {
        setRepoContext({
          ...repoContext,
          files: newContextFiles,
          structure: newStructure
        });
        
        setModifiedFiles(prev => {
          const next = new Set(prev);
          updatedPaths.forEach(p => next.add(p));
          return next;
        });

        setNotification({ 
          msg: `✅ ${updatedPaths.length} archivos modificados. Revisa la pestaña GitHub.`, 
          type: 'success' 
        });
      }
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, responseMessage]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "Lo siento, hubo un error al procesar tu solicitud. Intenta de nuevo.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectFile = async (file: FileNode) => {
    setSelectedFileNode(file);
    setActiveTab('code'); 
    setIsLoadingFile(true);
    setNotification(null);

    if (!isTextFile(file.path)) {
       setEditorContent('');
       setIsLoadingFile(false);
       return;
    }

    try {
      if (repoContext?.files.has(file.path)) {
        setEditorContent(repoContext.files.get(file.path)!);
      } else {
        const content = await fetchFileContent(file.url, githubToken);
        setEditorContent(content);
        repoContext?.files.set(file.path, content);
      }
    } catch (e) {
      console.error(e);
      setEditorContent("// Error al cargar contenido del archivo.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleSaveFile = async (path: string, content: string, sha: string, message: string) => {
    setIsSavingFile(true);
    try {
      if (githubToken) {
        // Real GitHub Save
        if (!repoContext) return;
        await updateFile(
          repoContext.owner, 
          repoContext.name, 
          path, 
          content, 
          sha, 
          message, 
          githubToken
        );
        setNotification({ msg: '¡Guardado en GitHub! Vercel iniciará el despliegue.', type: 'success' });
      } else {
        // Simulated Save
        await new Promise(resolve => setTimeout(resolve, 800));
        setNotification({ msg: 'Simulación: Archivo guardado localmente (Sin Token)', type: 'info' });
      }
      
      if (repoContext) {
        repoContext.files.set(path, content);
      }
      
      // Clear modified status on save
      setModifiedFiles(prev => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      });
      
      setTimeout(() => setNotification(null), 4000);

    } catch (e: any) {
      console.error(e);
      setNotification({ msg: `Error al guardar: ${e.message}`, type: 'error' });
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleDeployFromList = async (path: string) => {
    if (!repoContext) return;
    const content = repoContext.files.get(path);
    if (content === undefined) return;
    
    const fileNode = repoContext.structure.find(f => f.path === path);
    const sha = fileNode?.sha || ''; 
    const message = `AI Update: ${path}`;
    
    await handleSaveFile(path, content, sha, message);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setRepoContext(null);
    setMessages([]);
    setError(undefined);
    setGithubToken('');
    setActiveTab('chat');
    setSelectedFileNode(null);
    setModifiedFiles(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {appState === AppState.IDLE || appState === AppState.ERROR ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
          </div>

          <div className="z-10 w-full max-w-md">
            <div className="text-center mb-8 animate-fadeInDown">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-blue-400 mb-6">
                <Terminal className="w-3 h-3" />
                <span>Powered by Gemini 3.0 Pro</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                GitHub Repo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Importer</span>
              </h1>
              <p className="text-slate-400">
                Tu entorno de desarrollo en la nube. Conecta tu repositorio y empieza a codificar con IA.
              </p>
            </div>
            
            <RepoForm 
              onImport={handleImport} 
              isLoading={false} 
              error={error}
            />
            
            <div className="mt-8 text-center text-xs text-slate-500">
              <p>Funciona mejor con repositorios públicos de tamaño pequeño/mediano.</p>
            </div>
          </div>
        </div>
      ) : appState === AppState.IMPORTING || appState === AppState.ANALYZING ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950 z-20">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <Terminal className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Sincronizando Proyecto</h3>
              <p className="text-sm text-slate-400 animate-pulse">{loadingStatus}</p>
            </div>
            
            <div className="flex justify-center gap-2 pt-4">
              <div className={`h-1 w-8 rounded-full transition-colors duration-500 ${appState === AppState.IMPORTING ? 'bg-blue-500' : 'bg-blue-900'}`} />
              <div className={`h-1 w-8 rounded-full transition-colors duration-500 ${appState === AppState.ANALYZING ? 'bg-blue-500' : 'bg-slate-800'}`} />
              <div className="h-1 w-8 rounded-full bg-slate-800" />
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Main Navigation Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                   <Terminal className="w-5 h-5 text-white" />
                 </div>
                 <span className="font-semibold text-white hidden sm:block">{repoContext?.owner}/{repoContext?.name}</span>
               </div>
               
               <div className="h-6 w-px bg-slate-800 mx-2" />
               
               <nav className="flex bg-slate-800 p-1 rounded-lg">
                 <button
                   onClick={() => setActiveTab('chat')}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   <MessageSquare className="w-4 h-4" />
                   Chat
                 </button>
                 <button
                   onClick={() => setActiveTab('code')}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'code' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   <Code className="w-4 h-4" />
                   Código
                 </button>
                 <button
                   onClick={() => setActiveTab('github')}
                   className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all relative ${activeTab === 'github' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   <Github className="w-4 h-4" />
                   GitHub
                   {modifiedFiles.size > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                     </span>
                   )}
                 </button>
               </nav>
             </div>
             
             {notification && (
                <div className={`absolute top-16 right-4 px-4 py-2 rounded-lg text-sm shadow-xl flex items-center gap-2 animate-fadeIn z-50
                  ${notification.type === 'success' ? 'bg-green-600 text-white' : notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                    <span>{notification.msg}</span>
                </div>
             )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-w-0">
                 <ChatInterface 
                    messages={messages} 
                    onSendMessage={handleSendMessage} 
                    isSending={isSending}
                    repoName={repoContext ? `${repoContext.owner}/${repoContext.name}` : 'Repositorio'}
                    onReset={handleReset}
                  />
              </div>
            ) : activeTab === 'code' ? (
              <div className="flex-1 flex overflow-hidden">
                <FileExplorer 
                  files={repoContext?.structure || []} 
                  onSelectFile={handleSelectFile}
                  selectedPath={selectedFileNode?.path}
                  modifiedFiles={modifiedFiles}
                />
                <div className="flex-1 flex flex-col bg-slate-950 border-l border-slate-800 min-w-0">
                  {selectedFileNode ? (
                    isLoadingFile ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin mr-2" />
                        Cargando...
                      </div>
                    ) : (
                      isTextFile(selectedFileNode.path) ? (
                        <CodeEditor 
                          path={selectedFileNode.path}
                          sha={selectedFileNode.sha}
                          initialContent={editorContent}
                          onSave={handleSaveFile}
                          isSaving={isSavingFile}
                          hasToken={true} // Always allow trying to save, App handles simulation if no token
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                          {['png', 'jpg', 'jpeg', 'gif'].some(ext => selectedFileNode.path.toLowerCase().endsWith(ext)) ? (
                            <ImageIcon className="w-16 h-16 mb-4 opacity-50 text-blue-400" />
                          ) : (
                            <FileWarning className="w-16 h-16 mb-4 opacity-50 text-yellow-400" />
                          )}
                          <h3 className="text-lg font-medium text-slate-400 mb-2">Archivo Binario</h3>
                          <p className="text-sm max-w-xs">
                            Este archivo no se puede editar directamente en el editor de texto.
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                      <Layout className="w-16 h-16 mb-4 opacity-50" />
                      <p>Selecciona un archivo para ver o editar</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // GITHUB TAB (Source Control View)
              <div className="flex-1 bg-slate-950 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Github className="w-6 h-6" />
                      Control de Cambios
                    </h2>
                    {!githubToken && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-500">
                        <AlertTriangle className="w-3 h-3" />
                        Modo Simulación (Sin Token)
                      </div>
                    )}
                  </div>
                  
                  {modifiedFiles.size === 0 ? (
                    <div className="text-center py-12 border border-slate-800 rounded-xl bg-slate-900/50">
                      <Check className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-400">Todo sincronizado</h3>
                      <p className="text-slate-500 mt-2">No hay cambios pendientes de subir a GitHub.</p>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        Volver al Chat
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Cambios Pendientes ({modifiedFiles.size})</span>
                      </div>
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                       {Array.from(modifiedFiles).map(path => (
                         <div key={path} className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                           <div className="flex items-center gap-3">
                             <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                               <FileCode className="w-5 h-5 text-blue-400" />
                             </div>
                             <div>
                               <p className="font-mono text-sm text-slate-200 font-medium">{path}</p>
                               <span className="text-[10px] text-amber-500 flex items-center gap-1 mt-0.5 font-medium">
                                 <Bot className="w-3 h-3" /> Modificado por IA
                               </span>
                             </div>
                           </div>
                           <button
                             onClick={() => handleDeployFromList(path)}
                             disabled={isSavingFile}
                             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg
                               ${isSavingFile
                                 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                 : !githubToken 
                                   ? 'bg-blue-600 hover:bg-blue-500 text-white' // Blue for simulation
                                   : 'bg-green-600 hover:bg-green-500 text-white' // Green for real
                               }`}
                             title={!githubToken ? "Simular guardado (solo local)" : "Subir cambios a GitHub"}
                           >
                             {isSavingFile ? (
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             ) : (
                               <CloudUpload className="w-4 h-4" />
                             )}
                             <span>{!githubToken ? 'Simular Deploy' : 'Desplegar'}</span>
                           </button>
                         </div>
                       ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;