import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Check, Copy, ArrowDownToLine } from 'lucide-react';
import { ChatMessage, GlobalContextHandler } from '../types';
import { streamChatResponse } from '../services/geminiService';

interface GlobalChatProps {
  contextHandler: GlobalContextHandler | null;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ contextHandler }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: '你好！我是你的创作助手。我可以帮你修改大纲、润色剧本或提供灵感。' }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const modelMsgId = crypto.randomUUID();
    const modelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      isStreaming: true
    };
    setMessages(prev => [...prev, modelMsg]);

    try {
      // Get current content from the registered handler
      const currentContent = contextHandler ? contextHandler.getValue() : undefined;
      const contextName = contextHandler ? contextHandler.name : undefined;

      const stream = streamChatResponse(messages, userMsg.text, currentContent, contextName);
      
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === modelMsgId ? { ...m, text: fullText } : m
        ));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, text: "抱歉，连接断开了，请重试。" } : m
      ));
    } finally {
      setIsStreaming(false);
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { ...m, isStreaming: false } : m
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApply = (text: string) => {
    if (contextHandler) {
      contextHandler.setValue(text);
      // Optional: Show a toast or small animation
      alert(`已将内容应用到编辑器：${contextHandler.name}`);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 w-[400px] mb-4 overflow-hidden flex flex-col transition-all duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100 translate-y-0 h-[600px]' : 'opacity-0 translate-y-10 h-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            <span className="font-medium">智脑助手</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Context Indicator */}
        {contextHandler && (
          <div className="bg-emerald-50 px-4 py-2 text-xs text-emerald-700 border-b border-emerald-100 flex items-center gap-2 shrink-0">
            <Check size={12} />
            <span>当前已挂载: <strong>{contextHandler.name}</strong></span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
                {msg.role === 'model' && !msg.isStreaming && contextHandler && (
                   <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <button 
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                        title="复制内容"
                      >
                         <Copy size={12} /> 复制
                      </button>
                      <button 
                        onClick={() => handleApply(msg.text)}
                        className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 flex items-center gap-1 transition-colors font-medium"
                        title="直接替换当前编辑器内容"
                      >
                         <ArrowDownToLine size={12} /> 应用修改
                      </button>
                   </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入指令 (例如: 把这段改得更搞笑一点)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-14"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={`absolute right-2 top-2 p-2 rounded-lg transition-all ${
                input.trim() && !isStreaming 
                  ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                  : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto shadow-xl hover:scale-105 transition-all duration-300 rounded-full w-14 h-14 flex items-center justify-center text-white ${
            isOpen ? 'bg-slate-400 hover:bg-slate-500' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-indigo-500/30'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default GlobalChat;
