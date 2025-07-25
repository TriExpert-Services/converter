import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, BarChart3, AlertCircle, CheckCircle, FileImage, TrendingUp, Users, Clock } from 'lucide-react';

interface Analytics {
  totalConversions: number;
  successfulConversions: number;
  failedConversions: number;
  filesProcessed: number;
  currentDate: string;
}

interface ConversionResult {
  success: boolean;
  message: string;
  filename?: string;
  downloadPath?: string;
  fileSize?: number;
  error?: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        setSelectedFile(file);
        setResult(null);
      } else {
        alert('Please select a HEIC or HEIF file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const convertFile = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('heicFile', selectedFile);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        fetchAnalytics(); // Update analytics after successful conversion
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred',
        message: 'Failed to convert file'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadFile = () => {
    if (result?.downloadPath) {
      const link = document.createElement('a');
      link.href = result.downloadPath;
      link.download = result.filename || 'converted.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const successRate = analytics ? 
    analytics.totalConversions > 0 ? 
      ((analytics.successfulConversions / analytics.totalConversions) * 100).toFixed(1) 
      : '0' 
    : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileImage className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">HEIC to JPEG Converter</h1>
            </div>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Analytics Panel */}
        {showAnalytics && analytics && (
          <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
              Conversion Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-600/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm">Total Conversions</p>
                    <p className="text-2xl font-bold text-white">{analytics.totalConversions}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-green-600/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-200 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-white">{successRate}%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-purple-600/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm">Files Processed</p>
                    <p className="text-2xl font-bold text-white">{analytics.filesProcessed}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <div className="bg-orange-600/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-200 text-sm">Failed</p>
                    <p className="text-2xl font-bold text-white">{analytics.failedConversions}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Converter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upload HEIC File</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-blue-400 bg-blue-400/10' 
                  : 'border-white/30 hover:border-white/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-white/60 mx-auto mb-4" />
              <p className="text-white/80 mb-2">
                {selectedFile ? selectedFile.name : 'Drop your HEIC file here or click to browse'}
              </p>
              <p className="text-white/60 text-sm">
                Supports HEIC and HEIF formats (Max 50MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".heic,.heif,image/heic,image/heif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">
                  <strong>File:</strong> {selectedFile.name}
                </p>
                <p className="text-white/80 text-sm">
                  <strong>Size:</strong> {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            <button
              onClick={convertFile}
              disabled={!selectedFile || isConverting}
              className="w-full mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
            >
              {isConverting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <FileImage className="w-5 h-5 mr-2" />
                  Convert to JPEG
                </>
              )}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Conversion Result</h2>
            
            {!result && !isConverting && (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">Upload and convert a file to see results</p>
              </div>
            )}

            {isConverting && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white/80">Converting your file...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="p-4 bg-green-600/20 border border-green-600/30 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-200 font-semibold">Conversion Successful!</span>
                    </div>
                    <p className="text-white/80 text-sm mb-3">{result.message}</p>
                    
                    {result.filename && (
                      <div className="space-y-2 text-sm text-white/70">
                        <p><strong>Filename:</strong> {result.filename}</p>
                        {result.fileSize && (
                          <p><strong>Size:</strong> {formatFileSize(result.fileSize)}</p>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={downloadFile}
                      className="w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download JPEG
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                      <span className="text-red-200 font-semibold">Conversion Failed</span>
                    </div>
                    <p className="text-white/80 text-sm">
                      {result.error || result.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-white/60">
          <p className="text-sm">
            Running on port 4545 • Docker containerized • Built with React & Node.js
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;