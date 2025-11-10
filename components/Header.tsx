import React from 'react';
import { UserRole } from '../types.ts';
import { KeyIcon } from './icons/KeyIcon.tsx';
import { LogoIcon } from './icons/LogoIcon.tsx';
import { ImageIcon } from './icons/ImageIcon.tsx';

interface HeaderProps {
  userRole: UserRole;
  logoSrc: string | null;
  onRoleChangeRequest: (role: UserRole) => void;
  onChangePasswordClick: () => void;
  onUploadLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ userRole, logoSrc, onRoleChangeRequest, onChangePasswordClick, onUploadLogoClick }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <img src={logoSrc} alt="Company Logo" className="h-12 w-auto max-w-xs object-contain" />
            ) : (
              <LogoIcon />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">REYNOLDS GRAPHIC ARTS CORP.</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Price Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {userRole === UserRole.EDITOR && (
              <>
                <button
                    onClick={onUploadLogoClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Upload logo"
                >
                    <ImageIcon />
                    <span className="hidden sm:inline">Upload Logo</span>
                </button>
                <button
                    onClick={onChangePasswordClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Change password"
                >
                    <KeyIcon />
                    <span className="hidden sm:inline">Change Password</span>
                </button>
              </>
            )}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-3 hidden md:inline">Role:</span>
              <div className="relative">
                <select
                  value={userRole}
                  onChange={(e) => onRoleChangeRequest(e.target.value as UserRole)}
                  className="block appearance-none w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500"
                  aria-label="Change user role"
                >
                  <option value={UserRole.OBSERVER}>Observer</option>
                  <option value={UserRole.EDITOR}>Editor</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
