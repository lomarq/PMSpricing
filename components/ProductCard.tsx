import React from 'react';
import { Product, UserRole } from '../types.ts';
import { EditIcon } from './icons/EditIcon.tsx';

interface ProductCardProps {
  product: Product;
  userRole: UserRole;
  onEdit: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userRole, onEdit }) => {
  const isEditor = userRole === UserRole.EDITOR;
  const sortedTiers = product.priceTiers.sort((a, b) => a.pounds - b.pounds);
  const tariff = product.tariff ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl relative">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.colorName}</h3>
                {tariff > 0 && (
                    <span className="text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                        +{tariff}% Tariff
                    </span>
                 )}
            </div>
            {isEditor && (
                <button
                    onClick={() => onEdit(product)}
                    className="p-2 -mt-1 -mr-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={`Edit ${product.colorName}`}
                >
                    <EditIcon />
                </button>
            )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-4 gap-x-2 text-center">
            {/* Row 1: Labels */}
            {sortedTiers.map((tier, index) => {
              const nextTier = sortedTiers[index + 1];
              const tierLabel = nextTier ? `${tier.pounds}-${nextTier.pounds - 1}` : `${tier.pounds}+`;
              return (
                <div key={`label-${tier.pounds}`} className="text-xs text-gray-500 dark:text-gray-400 pb-1">
                  {tierLabel} lbs
                </div>
              );
            })}

            {/* Row 2: Prices */}
            {sortedTiers.map(tier => {
              const originalPrice = tier.pricePerPound;
              const finalPrice = originalPrice * (1 + tariff / 100);
              return (
                <div key={`price-${tier.pounds}`}>
                  {tariff > 0 && (
                    <p className="text-xs font-mono text-gray-500 line-through">
                      ${originalPrice.toFixed(2)}
                    </p>
                  )}
                  <p className="font-mono font-bold text-base text-gray-900 dark:text-white">
                    ${finalPrice.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
