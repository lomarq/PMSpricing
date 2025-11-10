import React from 'react';
import { ProductCard } from './ProductCard.tsx';
import { Product, UserRole } from '../types.ts';

interface ProductListProps {
  products: Product[];
  userRole: UserRole;
  onEdit: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, userRole, onEdit }) => {
  if (products.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 mt-8">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          userRole={userRole}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};
