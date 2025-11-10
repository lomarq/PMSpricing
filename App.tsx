import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { SearchBar } from './components/SearchBar.tsx';
import { ProductList } from './components/ProductList.tsx';
import { EditPriceModal } from './components/EditPriceModal.tsx';
import { PasswordModal } from './components/PasswordModal.tsx';
import { DbUploadModal } from './components/DbUploadModal.tsx';
import { CsvUploadModal } from './components/CsvUploadModal.tsx';
import { TariffModal } from './components/TariffModal.tsx';
import { ChangePasswordModal } from './components/ChangePasswordModal.tsx';
import { UploadLogoModal } from './components/UploadLogoModal.tsx';
import { Product, UserRole } from './types.ts';
import * as api from './services/googleSheetsService.ts';
import { UploadIcon } from './components/icons/UploadIcon.tsx';
import { TagIcon } from './components/icons/TagIcon.tsx';
import { SaveIcon } from './components/icons/SaveIcon.tsx';


function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.OBSERVER);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);

  const [isCsvUploadModalOpen, setIsCsvUploadModalOpen] = useState<boolean>(false);
  const [isDbUploadModalOpen, setIsDbUploadModalOpen] = useState<boolean>(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isUploadLogoModalOpen, setIsUploadLogoModalOpen] = useState<boolean>(false);

  const [logoSrc, setLogoSrc] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.initializeData();
      const data = api.getFullDataState();
      setProducts(data.products);
      setLogoSrc(data.logo || null);
    } catch (err) {
      setError('Failed to load application data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const reloadDataFromSession = useCallback(() => {
    const data = api.getFullDataState();
    setProducts(data.products);
    setLogoSrc(data.logo || null);
  }, []);


  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleRoleChangeRequest = (role: UserRole) => {
    if (role === UserRole.EDITOR) {
      setIsPasswordModalOpen(true);
    } else {
      setUserRole(UserRole.OBSERVER);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifyingPassword(true);
    setPasswordError(null);
    const isValid = await api.verifyPassword(password);
    if (isValid) {
      setUserRole(UserRole.EDITOR);
      setIsPasswordModalOpen(false);
    } else {
      setPasswordError('Incorrect password.');
    }
    setIsVerifyingPassword(false);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleSaveProduct = async (product: Product) => {
    setIsSaving(true);
    try {
      await api.updateSingleProduct(product);
      reloadDataFromSession();
      setEditingProduct(null);
    } catch (err) {
      console.error("Failed to save product", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllProducts = async (newProducts: Product[]) => {
      await api.saveAllProducts(newProducts);
      reloadDataFromSession();
  };

  const handleCsvUpdate = async (newProducts: Product[]) => {
    await api.saveAllProducts(newProducts);
    reloadDataFromSession();
  };
  
  const handleChangePassword = async (current: string, newPass: string) => {
    await api.changePassword(current, newPass);
  };

  const handleSaveLogo = async (logoBase64: string) => {
    await api.saveLogo(logoBase64);
    reloadDataFromSession();
  };

  const handleDownloadData = () => {
    const data = api.getFullDataState();
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'db.json');
    linkElement.click();
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.colorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Loading application data...</div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    return <ProductList products={filteredProducts} userRole={userRole} onEdit={handleEditProduct} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header
        userRole={userRole}
        logoSrc={logoSrc}
        onRoleChangeRequest={handleRoleChangeRequest}
        onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        onUploadLogoClick={() => setIsUploadLogoModalOpen(true)}
      />

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <SearchBar onSearch={setSearchTerm} />
          {userRole === UserRole.EDITOR && (
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
                  <button onClick={() => setIsTariffModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    <TagIcon />
                    <span className="hidden sm:inline">Apply Tariffs</span>
                  </button>
                  <button onClick={() => setIsCsvUploadModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                    <UploadIcon/>
                    <span className="hidden sm:inline">Upload CSV</span>
                  </button>
                  <button onClick={() => setIsDbUploadModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <UploadIcon/>
                    <span className="hidden sm:inline">Upload Data File</span>
                  </button>
                   <button onClick={handleDownloadData} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <SaveIcon/>
                    <span className="hidden sm:inline">Download Data File</span>
                  </button>
              </div>
          )}
        </div>

        {renderContent()}
      </main>

      {editingProduct && (
        <EditPriceModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
          isSaving={isSaving}
        />
      )}

      {isPasswordModalOpen && (
        <PasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handlePasswordSubmit}
          isVerifying={isVerifyingPassword}
          error={passwordError}
        />
      )}

      {isCsvUploadModalOpen && (
        <CsvUploadModal
          onClose={() => setIsCsvUploadModalOpen(false)}
          onSave={handleCsvUpdate}
        />
      )}

      {isDbUploadModalOpen && (
        <DbUploadModal
            onClose={() => setIsDbUploadModalOpen(false)}
            onSave={async (data) => {
              await api.setFullDataState(data);
              reloadDataFromSession();
            }}
        />
      )}

      {isTariffModalOpen && (
        <TariffModal
            products={products}
            onClose={() => setIsTariffModalOpen(false)}
            onSave={handleSaveAllProducts}
        />
      )}
      
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
            onClose={() => setIsChangePasswordModalOpen(false)}
            onSave={handleChangePassword}
        />
      )}

      {isUploadLogoModalOpen && (
        <UploadLogoModal
            onClose={() => setIsUploadLogoModalOpen(false)}
            onSave={handleSaveLogo}
        />
      )}

    </div>
  );
}

export default App;
