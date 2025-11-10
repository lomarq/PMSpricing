import React, { useState, useEffect } from 'react';
import { Product, PriceTier } from '../types.ts';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { SaveIcon } from './icons/SaveIcon.tsx';

interface EditPriceModalProps {
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
  isSaving: boolean;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({ product, onClose, onSave, isSaving }) => {
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);

  useEffect(() => {
    // Deep copy to avoid mutating original state
    setPriceTiers(JSON.parse(JSON.stringify(product.priceTiers.sort((a,b) => a.pounds - b.pounds))));
  }, [product]);

  const handlePriceChange = (index: number, value: string) => {
    const newPriceTiers = [...priceTiers];
    const newPrice = parseFloat(value);
    newPriceTiers[index].pricePerPound = isNaN(newPrice) ? 0 : newPrice;
    setPriceTiers(newPriceTiers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...product, priceTiers });
  };
  
  // Handle Escape key
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Prices for {product.colorName}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {priceTiers.map((tier, index) => {
                const nextTier = priceTiers[index + 1];
                const tierLabel = nextTier
                  ? `${tier.pounds} - ${nextTier.pounds - 1} lbs`
                  : `${tier.pounds}+ lbs`;

                return (
                  <div key={tier.pounds} className="flex items-center gap-4">
                    <label className="w-28 text-gray-600 dark:text-gray-300 font-medium text-right">
                      {tierLabel}
                    </label>
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={tier.pricePerPound}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                  </div>
                );
            })}
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
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
