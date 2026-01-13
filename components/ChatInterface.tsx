import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, User, Bot, FileCode, RotateCcw, Terminal, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isSending: boolean;
  repoName: string;
  onReset: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isSending, 
  repoName,
  onReset
}) => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleCopyClone = () => {
    const command = `git clone https://github.com/${repoName}.git`;
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FileCode className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-semibold text-white">{repoName}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-400">Gemini 3 Pro Conectado</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopyClone}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
              copied 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Copiar comando git clone"
          >
            {copied ? <Check className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {copied ? 'Copiado' : 'Clonar Repositorio'}
            </span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          <button 
            onClick={onReset}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Importar otro repositorio"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
            <Bot className="w-16 h-16" />
            <p className="text-center max-w-xs">
              El repositorio ha sido importado. Pregúntame cualquier cosa sobre el código.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            )}
            
            <div
              className={`px-5 py-3 rounded-2xl max-w-[95%] sm:max-w-[85%] leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown 
                    components={{
                      code({node, inline, className, children, ...props}: any) {
                        const codeText = String(children).replace(/\n$/, '');
                        if (inline) {
                          return (
                            <code className="bg-slate-950 px-1.5 py-0.5 rounded text-xs font-mono text-blue-300" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return (
                          <div className="my-3 rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
                              <span className="text-xs text-slate-400 font-mono">Código generado</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => navigator.clipboard.writeText(codeText)}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                  title="Copiar al portapapeles"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="p-3 overflow-x-auto">
                              <code className="text-sm font-mono text-blue-300" {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        );
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex gap-4 max-w-4xl mx-auto">
             <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-slate-800 border border-slate-700 px-5 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: Modifica App.tsx para añadir un botón de login..."
            className="w-full pl-4 pr-12 py-3.5 bg-slate-800 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all shadow-lg"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-500">Gemini puede cometer errores. Verifica la información importante.</p>
        </div>
      </div>
    </div>
  );
};
