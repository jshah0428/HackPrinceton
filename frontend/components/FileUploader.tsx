'use client';

import { Upload, File, X } from 'lucide-react';
import { useState } from 'react';

interface FileUploaderProps {
  onUploadComplete: (files: File[]) => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUploadComplete(selectedFiles);
      setSelectedFiles([]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${isDragging 
            ? 'border-white bg-gray-800/50 scale-105 shadow-lg shadow-white/20' 
            : 'border-gray-600 hover:border-white hover:bg-gray-900/50'
          }
        `}
      >
        <input
          type="file"
          id="fileInput"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-full shadow-lg">
            <Upload className="w-12 h-12 text-black" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Upload Medical Records
            </h3>
            <p className="text-gray-400">
              Drag and drop your files here, or click to browse
            </p>
          </div>

          <label
            htmlFor="fileInput"
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold cursor-pointer hover:shadow-lg hover:shadow-white/30 hover:scale-105 transition-all duration-200"
          >
            Choose Files
          </label>

          <p className="text-xs text-gray-500">
            Supports PDF, Images, Word documents
          </p>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="font-semibold text-white">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-sm hover:shadow-md hover:border-white transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg">
                  <File className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-red-400" />
              </button>
            </div>
          ))}
          
          <button
            onClick={handleUpload}
            className="w-full py-4 bg-white text-black rounded-xl font-bold hover:shadow-xl hover:shadow-white/30 hover:scale-105 transition-all duration-200"
          >
            Upload & Analyze
          </button>
        </div>
      )}
    </div>
  );
}

