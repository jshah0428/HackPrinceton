'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import SymptomsDisplay from '@/components/SymptomsDisplay';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [showSymptoms, setShowSymptoms] = useState(false);

  const handleUploadComplete = async (files: File[]) => {
    try {
      // Store file info
      const filesInfo = files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }));
      
      sessionStorage.setItem('uploadedFiles', JSON.stringify(filesInfo));
      sessionStorage.setItem('uploadTime', new Date().toISOString());
      sessionStorage.setItem('analysisStatus', 'processing');
      
      // Send files to backend for analysis
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      })
        .then(response => response.json())
        .then(data => {
          sessionStorage.setItem('analysisResult', JSON.stringify(data));
          sessionStorage.setItem('analysisStatus', 'complete');
        })
        .catch(error => {
          console.error('Analysis error:', error);
          sessionStorage.setItem('analysisStatus', 'error');
        });
      
      // Navigate to confirmation page immediately
      router.push('/confirmation');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    }
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
            <div className="flex items-center space-x-4">
              <Image 
                src="/logoo.png" 
                alt="DoctorVoice Logo" 
                width={540} 
                height={180}
                className="h-36 w-auto"
                priority
              />
            </div>
            
            {/* POWERFUL Quote in Center */}
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold text-white tracking-tight">
                Your voice. Your health. Guided by AI.
              </p>
            </div>
            
            <div className="text-sm text-gray-400 whitespace-nowrap">
              AI-Powered Medical Analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Upload Section */}
        <section id="upload" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-white mb-4">
              Upload Your Medical Records
            </h2>
            <p className="text-xl text-gray-400">
              Securely upload your documents for instant AI analysis
            </p>
          </div>
          
          <FileUploader onUploadComplete={handleUploadComplete} />
        </section>

        {/* Symptoms Section */}
        {showSymptoms && (
          <section id="symptoms" className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Detected Symptoms
              </h2>
              <p className="text-xl text-gray-400">
                AI analysis of your medical data
              </p>
            </div>
            
            <SymptomsDisplay />
          </section>
        )}

        {/* Empty State */}
        {!showSymptoms && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎙️</div>
            <p className="text-xl text-gray-400">
              Upload your medical records to get started
            </p>
          </div>
        )}
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
