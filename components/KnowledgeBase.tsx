import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Book, ScrollText, PenTool, FileType as FileTypeIcon, AlertCircle, LayoutTemplate, Users } from 'lucide-react';
// @ts-ignore
import * as mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';
import { KnowledgeFile, FileType } from '../types';
import { FILE_TYPE_LABELS } from '../constants';

interface KnowledgeBaseProps {
  files: KnowledgeFile[];
  setFiles: React.Dispatch<React.SetStateAction<KnowledgeFile[]>>;
  onNext: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ files, setFiles, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    let text = "";
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
        if (result.messages.length > 0) {
          console.warn("Mammoth messages:", result.messages);
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        // Read the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert to text (tab separated mostly or csv-like)
        text = XLSX.utils.sheet_to_txt(sheet);
      } else if (fileName.endsWith('.doc')) {
        alert(`暂不支持直接解析旧版 Word (.doc) 二进制格式：${file.name}。\n建议另存为 .docx 格式后上传，或将其内容复制到 txt 文件中。`);
        return;
      } else {
        // Default text reading for txt, md, json, csv
        text = await file.text();
      }

      if (!text.trim()) {
        console.warn(`File ${file.name} appears empty after parsing.`);
      }

      const newFile: KnowledgeFile = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.name.includes('小说') ? FileType.NOVEL : 
              (file.name.includes('排版') || file.name.includes('格式')) ? FileType.FORMAT_REF : 
              (file.name.includes('文笔') || file.name.includes('风格')) ? FileType.STYLE_REF :
              (file.name.includes('人设') || file.name.includes('档案')) ? FileType.CHARACTER_BIBLE :
              FileType.OTHER,
        content: text,
        uploadDate: Date.now()
      };
      setFiles(prev => [...prev, newFile]);
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      alert(`解析文件失败: ${file.name}。请确保文件未损坏。`);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    setIsProcessing(true);
    const filesArray = Array.from(fileList);
    
    // Process strictly sequentially to avoid browser freezing on large files
    for (const file of filesArray) {
      await processFile(file);
    }
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow selecting same file again if needed
    if (e.target.value) e.target.value = ''; 
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const changeFileType = (id: string, newType: FileType) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, type: newType } : f));
  };

  const getIcon = (type: FileType) => {
    switch (type) {
      case FileType.NOVEL: return <Book className="text-blue-500" />;
      case FileType.FORMAT_REF: return <LayoutTemplate className="text-purple-500" />;
      case FileType.STYLE_REF: return <PenTool className="text-pink-500" />;
      case FileType.GENERATED_SCRIPT: return <FileText className="text-green-500" />;
      case FileType.CHARACTER_BIBLE: return <Users className="text-orange-500" />;
      default: return <FileTypeIcon className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">知识库构建</h2>
        <p className="text-slate-500">上传小说原著、排版参考或文笔参考资料，为 AI 提供创作源泉</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleChange}
          accept=".txt,.md,.json,.csv,.docx,.doc,.xlsx,.xls" 
        />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
            {isProcessing ? (
               <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
            ) : (
               <UploadCloud size={40} />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">
                {isProcessing ? "正在解析文件..." : "点击或拖拽文件上传"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
                支持 txt, md, json, docx, xlsx, csv
            </p>
          </div>
          <button
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            disabled={isProcessing}
            className={`px-6 py-2 text-white rounded-lg transition-colors shadow-sm ${
                isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            选择文件
          </button>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700">已上传资料 ({files.length})</h3>
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-100">
              请为文件选择正确的分类以便AI识别
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {files.map(file => (
              <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                    {getIcon(file.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(file.uploadDate).toLocaleString()} • {(file.content.length / 1000).toFixed(1)}k chars
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <select
                    value={file.type}
                    onChange={(e) => changeFileType(file.id, e.target.value as FileType)}
                    className="text-sm border-slate-200 rounded-md py-1.5 px-3 bg-white text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {Object.entries(FILE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={files.length === 0 || isProcessing}
          className={`px-8 py-3 rounded-lg font-medium text-lg shadow-md transition-all ${
            files.length > 0 && !isProcessing
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:-translate-y-0.5'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          下一步：选择作业流程
        </button>
      </div>
    </div>
  );
};

export default KnowledgeBase;