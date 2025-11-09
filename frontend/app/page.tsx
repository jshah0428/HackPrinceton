'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUploader from '@/components/FileUploader';
import SymptomsDisplay from '@/components/SymptomsDisplay';
import Image from 'next/image';
import { saveMedicalRecord, updateMedicalRecordAnalysis } from '@/lib/records';
import Link from 'next/link';

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
      
      const uploadTime = new Date().toISOString();
      
      // Save to sessionStorage for confirmation page
      sessionStorage.setItem('uploadedFiles', JSON.stringify(filesInfo));
      sessionStorage.setItem('uploadTime', uploadTime);
      sessionStorage.setItem('analysisStatus', 'processing');
      
      // Save to localStorage for records page
      const record = saveMedicalRecord({
        uploadDate: uploadTime,
        files: filesInfo,
      });
      
            // Send files to backend for analysis with record ID
            const formData = new FormData();
            files.forEach((file) => {
              formData.append('files', file);
            });
        
            fetch(`http://localhost:8000/analyze?record_id=${record.id}`, {
              method: 'POST',
              body: formData,
            })
        .then(async response => {
          if (!response.ok) {
            // Try to parse JSON error, but handle if it's not JSON
            let errorMessage = `Server error: ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorData.message || errorMessage;
            } catch (e) {
              // If not JSON, try to get text
              try {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
              } catch (textError) {
                // Use default message
              }
            }
            throw new Error(errorMessage);
          }
          return response.json();
        })
        .then(data => {
          console.log('Analysis complete:', data);
          sessionStorage.setItem('analysisResult', JSON.stringify(data));
          sessionStorage.setItem('analysisStatus', 'complete');
          
          // Update the record with analysis results
          updateMedicalRecordAnalysis(record.id, {
            success: data.success,
            analysis: data.analysis,
            files_processed: data.files_processed,
            extracted_text_length: data.extracted_text_length,
            total_size_mb: data.total_size_mb,
            analysis_length: data.analysis_length,
          });
        })
        .catch(error => {
          console.error('Analysis error:', error);
          sessionStorage.setItem('analysisStatus', 'error');
          
          // Update record with error
          updateMedicalRecordAnalysis(record.id, {
            success: false,
            analysis: `Error: ${error.message}`,
          });
        });
      
      // Navigate to records page with the new record ID
      router.push(`/records?recordId=${record.id}`);
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
            
            <div className="flex items-center gap-3">
              <Link 
                href="/records"
                className="text-sm text-gray-400 hover:text-white whitespace-nowrap transition-colors"
              >
                View Medical Records →
              </Link>
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
