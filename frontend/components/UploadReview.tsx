'use client';

import { CheckCircle, FileText, Calendar, Clock } from 'lucide-react';

interface UploadReviewProps {
  files: File[];
  uploadTime: Date;
}

export default function UploadReview({ files, uploadTime }: UploadReviewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-green-500 rounded-full">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Upload Successful!
            </h2>
            <p className="text-gray-600">
              Your medical records have been processed
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-gray-700">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="font-medium">
              Date: {uploadTime.toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-3 text-gray-700">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="font-medium">
              Time: {uploadTime.toLocaleTimeString()}
            </span>
          </div>

          <div className="mt-6 pt-6 border-t-2 border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Uploaded Files ({files.length})
              </h3>
            </div>
            
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                >
                  <span className="font-medium text-gray-700">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

