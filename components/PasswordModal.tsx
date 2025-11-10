import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { LockIcon } from './icons/LockIcon.tsx';

interface PasswordModalProps {
  onClose: () => void;
  onSubmit: (password: string) => void;
  isVerifying: boolean;
  error: string | null;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSubmit, isVerifying, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editor Access</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please enter the password to access editor functionalities.
            </p>
            <div>
              <label htmlFor="editor-password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  id="editor-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border rounded-lg focus:outline-none focus:ring-2 ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'}`}
                  placeholder="Password"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]"
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
