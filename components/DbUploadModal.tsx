import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';

interface DbUploadModalProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const DbUploadModal: React.FC<DbUploadModalProps> = ({ onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('File is empty or could not be read.');
        }

        const data = JSON.parse(text);

        // Basic validation
        if (typeof data !== 'object' || data === null || !Array.isArray(data.products) || typeof data.password !== 'string') {
            throw new Error('Invalid db.json format. Must be an object with "products" (array) and "password" (string).');
        }
        
        await onSave(data);
        setSuccess(`Successfully loaded new data file. The application will now use this data.`);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred. Make sure it is a valid JSON file.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsProcessing(false);
    };

    reader.readAsText(file);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Data File</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instructions:</strong> This will <strong className="font-semibold">replace all current data</strong> in your session with the contents of the selected <code className="font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">db.json</code> file.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    To make changes permanent for all users, you must use the "Download Data File" button first, then manually replace the `db.json` file on your web server with the downloaded version.
                </p>
            </div>
            
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select db.json File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none">
            {success ? 'Close' : 'Cancel'}
          </button>
          <button type="button" onClick={handleProcessFile} disabled={isProcessing || !file} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2">
            {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                <>
                  <UploadIcon />
                  Process File
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
};
