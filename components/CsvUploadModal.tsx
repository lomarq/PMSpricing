import React, { useState, useEffect } from 'react';
import { Product, PriceTier } from '../types.ts';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { UploadIcon } from './icons/UploadIcon.tsx';

interface CsvUploadModalProps {
  onClose: () => void;
  onSave: (products: Product[]) => Promise<void>;
}

const REQUIRED_HEADERS = ['id', 'colorname', 'price_5_24', 'price_25_89', 'price_90_499', 'price_500_plus'];
const POUND_LEVELS = [5, 25, 90, 500];

/**
 * A robust parser for a single row of a CSV file.
 * Handles quoted fields containing commas.
 */
const parseCsvRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

/**
 * Safely parses a string into a float, handling various formats.
 * - Strips currency symbols and whitespace.
 * - Handles both '.' and ',' as decimal separators.
 * - Handles thousands separators.
 */
const safeParseFloat = (str: string): number | null => {
    if (typeof str !== 'string' || str.trim() === '') {
        return null;
    }
    // Remove all non-numeric characters except for one comma or period
    let cleaned = str.replace(/[^0-9.,-]+/g, "").trim();

    // Determine if comma or period is the decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');

    if (lastComma > lastPeriod) { // European format e.g., "1.234,56"
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else { // US format e.g., "1,234.56"
        cleaned = cleaned.replace(/,/g, '');
    }

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};


export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ onClose, onSave }) => {
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
        if (!text) throw new Error('File is empty or could not be read.');

        const lines = text.split(/\r\n|\n/);
        
        // Remove BOM character if present
        if (lines[0].charCodeAt(0) === 0xFEFF) {
            lines[0] = lines[0].substring(1);
        }

        const headerRow = lines.shift()?.toLowerCase() ?? '';
        const headers = parseCsvRow(headerRow).map(h => h.replace(/"/g, '').trim());
        
        const headerMap: { [key: string]: number } = {};
        headers.forEach((h, i) => {
            headerMap[h] = i;
        });

        const missingHeaders = REQUIRED_HEADERS.filter(h => headerMap[h] === undefined);
        if (missingHeaders.length > 0) {
            throw new Error(`CSV headers are incorrect or missing. Missing: [${missingHeaders.join(', ')}].`);
        }

        const newProducts: Product[] = [];
        lines.forEach((line, index) => {
            if (line.trim() === '') return; // Skip empty lines
            
            const values = parseCsvRow(line);
            
            const priceValues: (number | null)[] = REQUIRED_HEADERS.slice(2).map(h => safeParseFloat(values[headerMap[h]]));

            // Fill empty values with the last valid price
            let lastValidPrice: number | null = null;
            for (let i = 0; i < priceValues.length; i++) {
                if (priceValues[i] !== null) {
                    lastValidPrice = priceValues[i];
                } else if (lastValidPrice !== null) {
                    priceValues[i] = lastValidPrice;
                }
            }
            // Second pass for leading empty values
            for (let i = 0; i < priceValues.length; i++) {
                if (priceValues[i] !== null) {
                    lastValidPrice = priceValues[i];
                    break;
                }
            }
            if(lastValidPrice !== null) {
                for(let i=0; i < priceValues.length; i++) {
                    if(priceValues[i] === null) {
                        priceValues[i] = lastValidPrice;
                    }
                }
            }

            if (priceValues.some(p => p === null)) {
                console.warn(`Skipping row ${index + 2}: Contains a row with no valid prices.`);
                return;
            }

            const priceTiers: PriceTier[] = POUND_LEVELS.map((pounds, i) => ({
                pounds,
                pricePerPound: priceValues[i]!,
            }));
            
            newProducts.push({
                id: values[headerMap['id']].replace(/"/g, ''),
                colorName: values[headerMap['colorname']].replace(/"/g, ''),
                priceTiers,
            });
        });

        if (newProducts.length === 0) {
          throw new Error("File processed, but no valid product rows were found. Please check the file's content, formatting, and headers.");
        }

        await onSave(newProducts);
        setSuccess(`${newProducts.length} product(s) successfully loaded from CSV.`);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Products from CSV</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This will <strong className="font-semibold">replace all current products</strong> with data from the CSV file. Your logo and editor password will not be affected.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    <strong>Required Headers:</strong> <code className="font-mono text-xs bg-gray-200 dark:bg-gray-600 rounded px-1">id, colorname, price_5_24, price_25_89, price_90_499, price_500_plus</code>
                </p>
                 <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Empty price cells will be filled with the last valid price from their row.
                </p>
            </div>
            <div>
              <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv, text/csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            {success && <p className="text-sm text-green-500 mt-2">{success}</p>}
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            {success ? 'Close' : 'Cancel'}
          </button>
          <button type="button" onClick={handleProcessFile} disabled={isProcessing || !file} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2">
            {isProcessing ? 'Processing...' : 'Process File'}
          </button>
        </div>
      </div>
    </div>
  );
};
