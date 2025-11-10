import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types.ts';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { TagIcon } from './icons/TagIcon.tsx';

interface TariffModalProps {
  products: Product[];
  onClose: () => void;
  onSave: (updatedProducts: Product[]) => Promise<void>;
}

export const TariffModal: React.FC<TariffModalProps> = ({ products, onClose, onSave }) => {
  const [tariff, setTariff] = useState<number>(0);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectionChange = (productId: string) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProductIds(newSelection);
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleSubmit = async (tariffValue: number) => {
    if (selectedProductIds.size === 0) {
      setError('Please select at least one product.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    const updatedProducts = products.map(p => {
      if (selectedProductIds.has(p.id)) {
        return { ...p, tariff: tariffValue };
      }
      return p;
    });

    try {
      await onSave(updatedProducts);
      onClose();
    } catch (err) {
      setError('Failed to save tariff changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const isAllSelected = useMemo(() => products.length > 0 && selectedProductIds.size === products.length, [products, selectedProductIds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg flex flex-col" style={{height: '90vh', maxHeight: '700px'}} onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply Tariff to Products</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto">
            <div className="mb-6">
                <label htmlFor="tariff-percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tariff Percentage (%)
                </label>
                <input
                    id="tariff-percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g., 5.5"
                    value={tariff || ''}
                    onChange={(e) => setTariff(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div className="border rounded-lg border-gray-200 dark:border-gray-600">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center">
                    <input
                        id="select-all"
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                        Select All Products
                    </label>
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {products.map(product => (
                        <li key={product.id} className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                             <input
                                id={`product-${product.id}`}
                                type="checkbox"
                                checked={selectedProductIds.has(product.id)}
                                onChange={() => handleSelectionChange(product.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex items-center gap-3">
                                <span className="text-sm text-gray-800 dark:text-gray-200">{product.colorName}</span>
                                {product.tariff && product.tariff > 0 && <span className="text-xs font-semibold text-green-600 dark:text-green-400">(Current: +{product.tariff}%)</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
             {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-between gap-4">
          <button
              type="button"
              onClick={() => handleSubmit(0)}
              disabled={isSaving || selectedProductIds.size === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              Remove Tariff
            </button>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none">
                    Cancel
                </button>
                <button type="button" onClick={() => handleSubmit(tariff)} disabled={isSaving || selectedProductIds.size === 0} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2">
                {isSaving ? 'Saving...' : 'Apply Tariff'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
