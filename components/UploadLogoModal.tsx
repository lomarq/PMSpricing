import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';

interface UploadLogoModalProps {
  onClose: () => void;
  onSave: (logoBase64: string) => Promise<void>;
}

export const UploadLogoModal: React.FC<UploadLogoModalProps> = ({ onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Free memory when the component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSave = () => {
    if (!selectedFile) return;

    setIsSaving(true);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await onSave(base64);
        onClose();
      } catch (err) {
        setError('Failed to save the logo. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };
    reader.onerror = () => {
      setIsSaving(false);
      setError('Failed to read the selected file.');
    };
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Company Logo</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-center items-center w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            {previewUrl ? (
              <img src={previewUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Image Preview</span>
            )}
          </div>
          <div>
            <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Image File
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedFile || isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving...
              </>
            ) : (
              <>
                <UploadIcon />
                Save Logo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
