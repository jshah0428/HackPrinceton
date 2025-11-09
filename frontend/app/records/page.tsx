'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getAllMedicalRecords, deleteMedicalRecord, saveMedicalRecord, updateMedicalRecordAnalysis, getMedicalRecordById, type MedicalRecord } from '@/lib/records';
import { File, Calendar, Trash2, ArrowLeft, AlertCircle, CheckCircle, Clock, Upload, Plus } from 'lucide-react';
import FileUploader from '@/components/FileUploader';

export default function RecordsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const loadRecords = () => {
    const loadedRecords = getAllMedicalRecords();
    const sortedRecords = loadedRecords.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    setRecords(sortedRecords);
    return sortedRecords;
  };

  useEffect(() => {
    // Load records from localStorage
    const loadedRecords = loadRecords();
    
    // Check for recordId in query params
    const recordId = searchParams?.get('recordId');
    if (recordId) {
      const record = getMedicalRecordById(recordId);
      if (record) {
        setSelectedRecord(record);
        // Remove query param from URL
        router.replace('/records', { scroll: false });
      } else if (loadedRecords.length > 0) {
        setSelectedRecord(loadedRecords[0]);
      }
    } else if (loadedRecords.length > 0 && !selectedRecord) {
      setSelectedRecord(loadedRecords[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh records periodically to catch updates from analysis completion
  useEffect(() => {
    if (!selectedRecord) return;
    
    const interval = setInterval(() => {
      const loadedRecords = loadRecords();
      setRecords(loadedRecords.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
      
      const updatedRecord = loadedRecords.find(r => r.id === selectedRecord.id);
      if (updatedRecord) {
        const currentAnalysisText = selectedRecord.analysis?.analysis || '';
        const updatedAnalysisText = updatedRecord.analysis?.analysis || '';
        const currentSuccess = selectedRecord.analysis?.success;
        const updatedSuccess = updatedRecord.analysis?.success;
        
        // Update if analysis text changed OR if success status changed
        if (currentAnalysisText !== updatedAnalysisText || currentSuccess !== updatedSuccess) {
          setSelectedRecord(updatedRecord);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [selectedRecord]);

  const handleUploadComplete = async (files: File[]) => {
    try {
      const filesInfo = files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }));
      
      const uploadTime = new Date().toISOString();
      
      // Save to localStorage for records page
      const record = saveMedicalRecord({
        uploadDate: uploadTime,
        files: filesInfo,
      });

      // Update records list
      const updatedRecords = loadRecords();
      setSelectedRecord(record);
      setShowUploader(false);
      
      // Send files to backend for analysis
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
          // Update the record with analysis results
          updateMedicalRecordAnalysis(record.id, {
            success: data.success,
            analysis: data.analysis,
            files_processed: data.files_processed,
            extracted_text_length: data.extracted_text_length,
            total_size_mb: data.total_size_mb,
            analysis_length: data.analysis_length,
          });
          
          // Reload records to get updated analysis
          const refreshedRecords = loadRecords();
          const updatedRecord = refreshedRecords.find(r => r.id === record.id);
          if (updatedRecord) {
            setSelectedRecord(updatedRecord);
          }
        })
        .catch(error => {
          console.error('Analysis error:', error);
          // Update record with error
          updateMedicalRecordAnalysis(record.id, {
            success: false,
            analysis: `Error: ${error.message}`,
          });
          
          // Reload records
          const refreshedRecords = loadRecords();
          const updatedRecord = refreshedRecords.find(r => r.id === record.id);
          if (updatedRecord) {
            setSelectedRecord(updatedRecord);
          }
        });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files. Please try again.');
    }
  };

  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this medical record?')) {
      deleteMedicalRecord(id);
      const updatedRecords = getAllMedicalRecords();
      setRecords(updatedRecords.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
      
      if (selectedRecord?.id === id) {
        setSelectedRecord(updatedRecords.length > 0 ? updatedRecords[0] : null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Background Logo */}
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
            
            <div className="flex-1 text-center">
              <p className="text-3xl font-bold text-white tracking-tight">
                Medical Records & Predictions
              </p>
            </div>
            
            <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="max-w-[1800px] mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Side - Medical Records List */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <File className="w-6 h-6" />
                Medical Records
              </h2>
              <span className="text-gray-400 text-sm">
                {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Add Files Button */}
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="mb-4 w-full py-3 px-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {showUploader ? 'Cancel Upload' : 'Add More Files'}
            </button>

            {/* File Uploader */}
            {showUploader && (
              <div className="mb-4 p-4 bg-black/50 rounded-xl border border-gray-700">
                <FileUploader onUploadComplete={handleUploadComplete} />
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {records.length === 0 ? (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No medical records yet</p>
                  <Link 
                    href="/"
                    className="mt-4 inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Upload Your First Record
                  </Link>
                </div>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`
                      p-4 rounded-xl border cursor-pointer transition-all
                      ${selectedRecord?.id === record.id
                        ? 'bg-white text-black border-white shadow-lg'
                        : 'bg-black/50 border-gray-700 hover:border-white hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className={`w-4 h-4 ${selectedRecord?.id === record.id ? 'text-gray-700' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${selectedRecord?.id === record.id ? 'text-gray-700' : 'text-gray-400'}`}>
                            {formatDate(record.uploadDate)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          {record.files.map((file, idx) => (
                            <div key={idx} className={`text-sm ${selectedRecord?.id === record.id ? 'text-gray-800' : 'text-white'}`}>
                              • {file.name}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {record.analysis ? (
                            record.analysis.success ? (
                              <span className={`text-xs px-2 py-1 rounded-full ${selectedRecord?.id === record.id ? 'bg-green-200 text-green-800' : 'bg-green-900/30 text-green-400 border border-green-500/30'}`}>
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                Analyzed
                              </span>
                            ) : (
                              <span className={`text-xs px-2 py-1 rounded-full ${selectedRecord?.id === record.id ? 'bg-red-200 text-red-800' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                Error
                              </span>
                            )
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${selectedRecord?.id === record.id ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              Processing
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteRecord(record.id, e)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedRecord?.id === record.id
                            ? 'hover:bg-red-200 text-red-700'
                            : 'hover:bg-red-900/50 text-red-400'
                        }`}
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Record Details */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <File className="w-6 h-6" />
              Record Details
            </h2>

            <div className="flex-1 overflow-y-auto pr-2">
              {!selectedRecord ? (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Select a medical record to view details</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Upload Information</h3>
                    <div className="space-y-3 text-gray-300">
                      <div>
                        <span className="text-gray-400">Upload Date:</span>
                        <span className="text-white ml-2 font-semibold">
                          {formatDate(selectedRecord.uploadDate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Number of Files:</span>
                        <span className="text-white ml-2 font-semibold">
                          {selectedRecord.files.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <span className="text-white ml-2">
                          {selectedRecord.analysis ? (
                            selectedRecord.analysis.success ? (
                              <span className="text-green-400">✓ Processed</span>
                            ) : (
                              <span className="text-red-400">✗ Error</span>
                            )
                          ) : (
                            <span className="text-yellow-400">○ Processing</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-4">Files</h3>
                    <div className="space-y-2">
                      {selectedRecord.files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-gray-400" />
                            <span className="text-white">{file.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3">View Analysis Dashboard</h3>
                    <p className="text-gray-300 mb-4 text-sm">
                      Access detailed health metrics, risk predictions, and personalized recommendations based on this record.
                    </p>
                    {selectedRecord.analysis && selectedRecord.analysis.success ? (
                      <Link
                        href="/future"
                        className="inline-block px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
                      >
                        Go to Dashboard →
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="inline-block px-6 py-3 bg-gray-600 text-gray-400 rounded-lg font-semibold cursor-not-allowed opacity-50"
                        title="Processing... Please wait for analysis to complete"
                      >
                        {selectedRecord.analysis && !selectedRecord.analysis.success
                          ? 'Analysis Failed'
                          : 'Processing...'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/95 backdrop-blur-sm border-t border-gray-800 mt-8">
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

