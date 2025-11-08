'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles, FileCheck, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadTime, setUploadTime] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Get data from sessionStorage
    const filesData = sessionStorage.getItem('uploadedFiles');
    const timeData = sessionStorage.getItem('uploadTime');

    if (!filesData || !timeData) {
      // If no data, redirect back to home
      router.push('/');
      return;
    }

    setFiles(JSON.parse(filesData));
    setUploadTime(timeData);
    setShowConfetti(true);

    // Don't clear sessionStorage immediately so files can be downloaded
  }, [router]);

  const handleViewFile = (file: UploadedFile) => {
    // Show a notification that the file is being processed
    alert(`📄 ${file.name}\n\nThis file has been uploaded and is being processed by our AI system.\n\nYou can retrieve it from your medical records dashboard once processing is complete.`);
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Logo - HUGE */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <Image 
          src="/logoo.png" 
          alt="Background" 
          width={1920} 
          height={1080}
          className="w-full h-full object-cover opacity-20"
          priority
        />
      </div>
      
      {/* Header */}
      <header className="bg-black/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50 shadow-xl relative">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-8">
            <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors whitespace-nowrap">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            
            {/* POWERFUL Quote in Center */}
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold text-white tracking-tight">
                Your voice. Your health. Guided by AI.
              </p>
            </div>
            
            <Image 
              src="/logoo.png" 
              alt="DoctorVoice Logo" 
              width={540} 
              height={180}
              className="h-36 w-auto"
              priority
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 relative z-10">
        {/* Success Animation */}
        <div className={`text-center mb-12 transition-all duration-1000 ${showConfetti ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative p-8 bg-white rounded-full shadow-2xl">
              <CheckCircle className="w-24 h-24 text-black" />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 animate-fade-in">
            Upload Successful! 🎉
          </h1>
          <p className="text-2xl text-gray-400 mb-8">
            Your medical records have been securely uploaded
          </p>
        </div>

        {/* Thank You Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 shadow-2xl mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white">
              Thank You!
            </h2>
          </div>
          
          <p className="text-lg text-gray-300 mb-4">
            We appreciate you trusting us with your medical information. Our AI is now processing your records to provide you with the most accurate symptom analysis.
          </p>
          
          <p className="text-gray-400">
            You'll receive detailed insights shortly. Our advanced algorithms are working hard to ensure you get the best possible care recommendations.
          </p>
        </div>

        {/* Upload Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="w-6 h-6 text-purple-400" />
            <h3 className="text-2xl font-bold text-white">
              Upload Details
            </h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Upload Time</span>
              <span className="text-white font-medium">
                {uploadTime ? new Date(uploadTime).toLocaleString() : 'Just now'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Number of Files</span>
              <span className="text-white font-medium">{files.length}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-800">
              <span className="text-gray-400">Status</span>
              <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                ✓ Processing
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Uploaded Files:</h4>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-gray-800 hover:border-white transition-all group"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <span className="text-white font-medium block">{file.name}</span>
                      <span className="text-gray-500 text-xs">
                        {(file.size / 1024).toFixed(2)} KB • Successfully uploaded
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-400 px-2 py-1 bg-green-900/30 rounded border border-green-500/30">
                      ✓ Secure
                    </span>
                    <button
                      className="p-2 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-200 hover:scale-110"
                      onClick={() => handleViewFile(file)}
                      title="View file info"
                    >
                      <Download className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex gap-4">
          <Link
            href="/"
            className="flex-1 py-4 px-6 bg-white text-black rounded-xl font-bold text-center hover:shadow-xl hover:shadow-white/30 hover:scale-105 transition-all duration-200"
          >
            Upload More Files
          </Link>
          <button
            className="flex-1 py-4 px-6 bg-gray-900 border border-gray-700 text-white rounded-xl font-bold hover:bg-gray-800 hover:border-white transition-all duration-200"
            onClick={() => {
              // Placeholder for viewing results
              alert('Results will be available once processing is complete!');
            }}
          >
            View Results
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-300 text-center">
            💡 <strong>Pro Tip:</strong> Check back in a few minutes to see your complete symptom analysis and health insights.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/95 backdrop-blur-sm border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-gray-400">
          <p className="text-sm">
            DoctorVoice - Your Health, Analyzed Intelligently
          </p>
          <p className="text-xs mt-2 text-gray-500">
            This tool is for informational purposes only. Always consult healthcare professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}

