
import * as api from './services/googleSheetsService.js';

// --- STATE MANAGEMENT ---
const state = {
  products: [],
  isLoading: true,
  error: null,
  searchTerm: '',
  userRole: 'Observer',
  logoSrc: null,
};

// --- DOM SELECTORS ---
const appContainer = document.getElementById('app-container');

// --- ICONS (as string literals) ---
const icons = {
  edit: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>`,
  upload: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>`,
  tag: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V3a2 2 0 012-2h2z" /></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
  lock: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" /></svg>`,
  image: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
  logo: `<svg class="h-8 w-8 text-blue-600 dark:text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 7L12 12M12 22V12M22 7L12 12M16.5 4.5L7.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>`,
  spinner: `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
};

// --- HELPER FUNCTIONS ---
const parseCsvRow = (row) => {
  const result = [];
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

const safeParseFloat = (str) => {
    if (typeof str !== 'string' || str.trim() === '') {
        return null;
    }
    let cleaned = str.replace(/[^0-9.,-]+/g, "").trim();
    const lastComma = cleaned.lastIndexOf(',');
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastComma > lastPeriod) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
        cleaned = cleaned.replace(/,/g, '');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
};

// --- RENDER FUNCTIONS ---
const renderApp = () => {
  const html = `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      ${createHeaderHTML()}
      ${createMainContentHTML()}
    </div>
    <div id="modal-container"></div>
  `;
  appContainer.innerHTML = html;
  attachEventListeners();
};

const renderMainContent = () => {
    const main = appContainer.querySelector('main');
    if(main) {
        main.outerHTML = createMainContentHTML();
    }
};

const createHeaderHTML = () => {
  return `
    <header class="bg-white dark:bg-gray-800 shadow-md">
      <div class="container mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center gap-3">
            ${state.logoSrc ? `<img src="${state.logoSrc}" alt="Company Logo" class="h-12 w-auto max-w-xs object-contain" />` : icons.logo}
            <div>
              <h1 class="text-lg font-bold text-gray-900 dark:text-white leading-tight">REYNOLDS GRAPHIC ARTS CORP.</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">Price Manager</p>
            </div>
          </div>
          <div class="flex items-center gap-2 md:gap-4">
            ${state.userRole === 'Editor' ? `
              <button data-action="upload-logo" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Upload logo">
                ${icons.image} <span class="hidden sm:inline">Upload Logo</span>
              </button>
              <button data-action="change-password" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Change password">
                ${icons.key} <span class="hidden sm:inline">Change Password</span>
              </button>
            ` : ''}
            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300 mr-3 hidden md:inline">Role:</span>
              <div class="relative">
                <select id="role-selector" class="block appearance-none w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:border-blue-500" aria-label="Change user role">
                  <option value="Observer" ${state.userRole === 'Observer' ? 'selected' : ''}>Observer</option>
                  <option value="Editor" ${state.userRole === 'Editor' ? 'selected' : ''}>Editor</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-200">
                  <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `;
};

const createMainContentHTML = () => {
  return `
    <main class="container mx-auto p-4 sm:p-6 lg:p-8">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="relative w-full md:w-80">
          <input id="search-bar" type="text" value="${state.searchTerm}" placeholder="Search by color name..." class="w-full px-4 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        ${state.userRole === 'Editor' ? `
          <div class="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <button data-action="apply-tariffs" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">${icons.tag} <span class="hidden sm:inline">Apply Tariffs</span></button>
            <button data-action="upload-csv" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">${icons.upload} <span class="hidden sm:inline">Upload CSV</span></button>
            <button data-action="upload-db" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">${icons.upload} <span class="hidden sm:inline">Upload Data File</span></button>
            <button data-action="download-db" class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">${icons.save} <span class="hidden sm:inline">Download Data File</span></button>
          </div>
        ` : ''}
      </div>
      <div id="product-list-container">
        ${createProductListHTML()}
      </div>
    </main>
  `;
};

const createProductListHTML = () => {
    const filteredProducts = state.products.filter(p =>
        p.colorName.toLowerCase().includes(state.searchTerm.toLowerCase())
    );

    if (state.isLoading) return `<div class="text-center p-8 text-gray-500 dark:text-gray-400 col-span-full">Loading application data...</div>`;
    if (state.error) return `<div class="text-center p-8 text-red-500 col-span-full">${state.error}</div>`;
    if (filteredProducts.length === 0) return `<p class="text-center text-gray-500 dark:text-gray-400 mt-8 col-span-full">No products found.</p>`;

    return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${filteredProducts.map(createProductCardHTML).join('')}</div>`;
}

const createProductCardHTML = (product) => {
  const isEditor = state.userRole === 'Editor';
  const sortedTiers = [...product.priceTiers].sort((a, b) => a.pounds - b.pounds);
  const tariff = product.tariff ?? 0;

  return `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl relative">
      <div class="p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 flex-wrap">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">${product.colorName}</h3>
            ${tariff > 0 ? `<span class="text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">+${tariff}% Tariff</span>` : ''}
          </div>
          ${isEditor ? `
            <button data-action="edit-product" data-product-id="${product.id}" class="p-2 -mt-1 -mr-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" aria-label="Edit ${product.colorName}">
              ${icons.edit}
            </button>
          ` : ''}
        </div>
        <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-4 gap-x-2 text-center">
            ${sortedTiers.map((tier, index) => {
              const nextTier = sortedTiers[index + 1];
              const tierLabel = nextTier ? `${tier.pounds}-${nextTier.pounds - 1}` : `${tier.pounds}+`;
              return `<div class="text-xs text-gray-500 dark:text-gray-400 pb-1">${tierLabel} lbs</div>`;
            }).join('')}
            ${sortedTiers.map(tier => {
              const originalPrice = tier.pricePerPound;
              const finalPrice = originalPrice * (1 + tariff / 100);
              return `
                <div>
                  ${tariff > 0 ? `<p class="text-xs font-mono text-gray-500 line-through">$${originalPrice.toFixed(2)}</p>` : ''}
                  <p class="font-mono font-bold text-base text-gray-900 dark:text-white">$${finalPrice.toFixed(2)}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
};


// --- MODAL HANDLING ---

const openModal = (modalHTML) => {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.innerHTML = modalHTML;
        const modalElement = modalContainer.querySelector('[data-modal]');
        modalElement?.addEventListener('click', (e) => {
            if (e.target === modalElement) closeModal();
        });
        modalContainer.querySelector('[data-action="close-modal"]')?.addEventListener('click', closeModal);
        document.addEventListener('keydown', handleEscKey, { once: true });
    }
};

const closeModal = () => {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
    document.removeEventListener('keydown', handleEscKey);
};

const handleEscKey = (e) => {
    if (e.key === 'Escape') closeModal();
};

const showMessageInModal = (containerId, text, type = 'error') => {
    const container = document.getElementById(containerId);
    if (container) {
        const color = type === 'error' ? 'red' : 'green';
        container.innerHTML = `<p class="text-sm text-${color}-500 mt-2">${text}</p>`;
    }
};

const setButtonState = (buttonId, text, disabled = false) => {
    const button = document.getElementById(buttonId);
    if(button) {
        button.disabled = disabled;
        button.innerHTML = text;
    }
}


// --- MODAL IMPLEMENTATIONS ---

const openCsvUploadModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upload Products from CSV</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p class="text-sm text-blue-800 dark:text-blue-200">This will <strong class="font-semibold">replace all current products</strong>.</p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-2"><strong>Required Headers:</strong> <code class="font-mono text-xs bg-gray-200 dark:bg-gray-600 rounded px-1">id, colorname, price_5_24, price_25_89, price_90_499, price_500_plus</code></p>
            </div>
            <input id="csv-upload-input" type="file" accept=".csv, text/csv" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
            <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button id="modal-cancel-btn" type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-process-btn" type="button" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2" disabled>Process File</button>
        </div>
      </div>
    </div>`;
    openModal(modalHTML);

    const fileInput = document.getElementById('csv-upload-input');
    const processBtn = document.getElementById('modal-process-btn');
    let selectedFile = null;

    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files?.[0];
        processBtn.disabled = !selectedFile;
        showMessageInModal('modal-message-container', '');
    });

    processBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        setButtonState('modal-process-btn', `${icons.spinner} Processing...`, true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result;
                if (!text) throw new Error('File is empty.');

                const lines = text.split(/\r\n|\n/).filter(Boolean);
                if (lines[0].charCodeAt(0) === 0xFEFF) lines[0] = lines[0].substring(1);

                const REQUIRED_HEADERS = ['id', 'colorname', 'price_5_24', 'price_25_89', 'price_90_499', 'price_500_plus'];
                const POUND_LEVELS = [5, 25, 90, 500];
                const headerRow = lines.shift()?.toLowerCase() ?? '';
                const headers = parseCsvRow(headerRow).map(h => h.replace(/"/g, '').trim());
                
                const headerMap = headers.reduce((acc, h, i) => ({...acc, [h]: i }), {});
                const missingHeaders = REQUIRED_HEADERS.filter(h => headerMap[h] === undefined);
                if (missingHeaders.length > 0) throw new Error(`Missing headers: [${missingHeaders.join(', ')}].`);

                const newProducts = lines.map((line, index) => {
                    const values = parseCsvRow(line);
                    const priceValues = REQUIRED_HEADERS.slice(2).map(h => safeParseFloat(values[headerMap[h]]));

                    let lastValidPrice = priceValues.reduce((last, current) => current ?? last, null);
                    if (!lastValidPrice) {
                        console.warn(`Skipping row ${index + 2}: No valid prices.`);
                        return null;
                    }
                    const finalPrices = priceValues.map(p => p ?? lastValidPrice);

                    return {
                        id: values[headerMap['id']].replace(/"/g, ''),
                        colorName: values[headerMap['colorname']].replace(/"/g, ''),
                        priceTiers: POUND_LEVELS.map((pounds, i) => ({ pounds, pricePerPound: finalPrices[i] })),
                    };
                }).filter(Boolean);

                if (newProducts.length === 0) throw new Error("No valid product rows found.");

                await api.saveAllProducts(newProducts);
                
                // Automatically download the updated db.json
                handleDownloadData();
                reloadDataFromSession();

                const successMessage = `
                    <strong>${newProducts.length} products loaded successfully!</strong><br><br>
                    The updated data file (<code class="font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">db.json</code>) has been automatically downloaded.<br>
                    <strong class="mt-2 block">To make these changes permanent for all users, please replace the file on your web server with the one you just downloaded.</strong>
                `;
                showMessageInModal('modal-message-container', successMessage, 'success');

                document.getElementById('modal-cancel-btn').textContent = 'Close';
                setButtonState('modal-process-btn', 'Process File', true);
            } catch (err) {
                showMessageInModal('modal-message-container', err.message);
                setButtonState('modal-process-btn', 'Process File', false);
            }
        };
        reader.onerror = () => {
            showMessageInModal('modal-message-container', 'Failed to read the file.');
            setButtonState('modal-process-btn', 'Process File', false);
        };
        reader.readAsText(selectedFile);
    });
};

const openDbUploadModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upload Data File</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p class="text-sm text-blue-800 dark:text-blue-200">This will <strong class="font-semibold">replace all current data</strong> with the contents of the selected <code class="font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">db.json</code> file.</p>
            </div>
            <input id="db-upload-input" type="file" accept=".json" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
            <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button id="modal-cancel-btn" type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-process-btn" type="button" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2" disabled>Process File</button>
        </div>
      </div>
    </div>`;
    openModal(modalHTML);

    const fileInput = document.getElementById('db-upload-input');
    const processBtn = document.getElementById('modal-process-btn');
    let selectedFile = null;

    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files?.[0];
        processBtn.disabled = !selectedFile;
        showMessageInModal('modal-message-container', '');
    });

    processBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        setButtonState('modal-process-btn', `${icons.spinner} Processing...`, true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (typeof data !== 'object' || !Array.isArray(data.products) || typeof data.password !== 'string') {
                    throw new Error('Invalid db.json format.');
                }
                await api.setFullDataState(data);
                showMessageInModal('modal-message-container', 'Successfully loaded new data file.', 'success');
                document.getElementById('modal-cancel-btn').textContent = 'Close';
                reloadDataFromSession();
            } catch (err) {
                showMessageInModal('modal-message-container', err.message);
                setButtonState('modal-process-btn', 'Process File', false);
            }
        };
        reader.onerror = () => {
             showMessageInModal('modal-message-container', 'Failed to read file.');
             setButtonState('modal-process-btn', 'Process File', false);
        };
        reader.readAsText(selectedFile);
    });
};

const openUploadLogoModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upload Company Logo</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4">
            <div id="logo-preview-box" class="flex justify-center items-center w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <span class="text-gray-500 dark:text-gray-400">Image Preview</span>
            </div>
            <input id="logo-upload-input" type="file" accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800" />
            <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-save-btn" type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2" disabled>${icons.upload} Save Logo</button>
        </div>
      </div>
    </div>`;
    openModal(modalHTML);

    const fileInput = document.getElementById('logo-upload-input');
    const saveBtn = document.getElementById('modal-save-btn');
    const previewBox = document.getElementById('logo-preview-box');
    let selectedFile = null;
    let objectUrl = null;

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        
        if (file && file.type.startsWith('image/')) {
            selectedFile = file;
            objectUrl = URL.createObjectURL(selectedFile);
            previewBox.innerHTML = `<img src="${objectUrl}" alt="Logo preview" class="max-h-full max-w-full object-contain" />`;
            saveBtn.disabled = false;
            showMessageInModal('modal-message-container', '');
        } else {
            selectedFile = null;
            previewBox.innerHTML = `<span class="text-gray-500 dark:text-gray-400">Image Preview</span>`;
            saveBtn.disabled = true;
            if(file) showMessageInModal('modal-message-container', 'Please select a valid image file.');
        }
    });

    saveBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        setButtonState('modal-save-btn', `${icons.spinner} Saving...`, true);

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                await api.saveLogo(reader.result);
                reloadDataFromSession();
                closeModal();
            } catch (err) {
                showMessageInModal('modal-message-container', 'Failed to save logo.');
                setButtonState('modal-save-btn', `${icons.upload} Save Logo`, false);
            }
        };
        reader.onerror = () => {
            showMessageInModal('modal-message-container', 'Failed to read file.');
            setButtonState('modal-save-btn', `${icons.upload} Save Logo`, false);
        };
        reader.readAsDataURL(selectedFile);
    });
};

const openChangePasswordModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form id="change-password-form" class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4">
            <div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${icons.lock}</div><input id="current-password" type="password" placeholder="Current Password" required class="w-full pl-10 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${icons.lock}</div><input id="new-password" type="password" placeholder="New Password" required class="w-full pl-10 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${icons.lock}</div><input id="confirm-password" type="password" placeholder="Confirm New Password" required class="w-full pl-10 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-save-btn" type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]">Update Password</button>
        </div>
      </form>
    </div>`;
    openModal(modalHTML);

    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (newPass !== confirmPass) {
            showMessageInModal('modal-message-container', "New passwords do not match.");
            return;
        }
        if (newPass.length < 6) {
            showMessageInModal('modal-message-container', "New password must be at least 6 characters long.");
            return;
        }
        
        setButtonState('modal-save-btn', `<span class="text-white">${icons.spinner}</span>`, true);
        try {
            await api.changePassword(current, newPass);
            showMessageInModal('modal-message-container', "Password changed successfully!", 'success');
            setTimeout(closeModal, 1500);
        } catch (err) {
            showMessageInModal('modal-message-container', err.message);
            setButtonState('modal-save-btn', 'Update Password', false);
        }
    });
};

const openTariffModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg flex flex-col" style="height: 90vh; max-height: 700px" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Apply Tariff to Products</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 flex-grow overflow-y-auto">
            <div class="mb-6">
                <label for="tariff-percentage" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tariff Percentage (%)</label>
                <input id="tariff-percentage" type="number" step="0.1" min="0" placeholder="e.g., 5.5" value="0" class="w-full px-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="border rounded-lg border-gray-200 dark:border-gray-600">
                <div class="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center"><input id="select-all" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label for="select-all" class="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">Select All Products</label></div>
                <ul id="tariff-product-list" class="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    ${state.products.map(p => `
                        <li class="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700">
                           <input id="product-${p.id}" data-product-id="${p.id}" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                           <label for="product-${p.id}" class="ml-3 flex items-center gap-3 cursor-pointer"><span class="text-sm text-gray-800 dark:text-gray-200">${p.colorName}</span>${p.tariff > 0 ? `<span class="text-xs font-semibold text-green-600 dark:text-green-400">(Current: +${p.tariff}%)</span>` : ''}</label>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-between gap-4">
            <button id="remove-tariff-btn" type="button" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed" disabled>Remove Tariff</button>
            <div class="flex justify-end gap-4">
                <button type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                <button id="apply-tariff-btn" type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2" disabled>Apply Tariff</button>
            </div>
        </div>
      </div>
    </div>`;
    openModal(modalHTML);
    
    const selectedIds = new Set();
    const checkboxes = Array.from(document.querySelectorAll('#tariff-product-list input[type="checkbox"]'));
    const selectAll = document.getElementById('select-all');
    const applyBtn = document.getElementById('apply-tariff-btn');
    const removeBtn = document.getElementById('remove-tariff-btn');

    const updateSelection = () => {
        selectedIds.clear();
        checkboxes.forEach(cb => {
            if (cb.checked) selectedIds.add(cb.dataset.productId);
        });
        selectAll.checked = selectedIds.size === checkboxes.length;
        applyBtn.disabled = selectedIds.size === 0;
        removeBtn.disabled = selectedIds.size === 0;
    };
    
    document.getElementById('tariff-product-list').addEventListener('change', updateSelection);
    selectAll.addEventListener('change', (e) => {
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateSelection();
    });

    const handleSave = async (isRemove = false) => {
        if (selectedIds.size === 0) {
            showMessageInModal('modal-message-container', 'Please select at least one product.');
            return;
        }
        const tariffValue = isRemove ? 0 : parseFloat(document.getElementById('tariff-percentage').value) || 0;
        
        setButtonState('apply-tariff-btn', `${icons.spinner} Saving...`, true);
        setButtonState('remove-tariff-btn', 'Saving...', true);

        const updatedProducts = state.products.map(p => selectedIds.has(p.id) ? { ...p, tariff: tariffValue } : p);

        try {
            await api.saveAllProducts(updatedProducts);
            reloadDataFromSession();
            closeModal();
        } catch (err) {
            showMessageInModal('modal-message-container', 'Failed to save tariff changes.');
            setButtonState('apply-tariff-btn', 'Apply Tariff', false);
            setButtonState('remove-tariff-btn', 'Remove Tariff', false);
            updateSelection();
        }
    };

    applyBtn.addEventListener('click', () => handleSave(false));
    removeBtn.addEventListener('click', () => handleSave(true));
};

const openEditPriceModal = (productId) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const sortedTiers = [...product.priceTiers].sort((a,b) => a.pounds - b.pounds);

    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form id="edit-price-form" class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Edit Prices for ${product.colorName}</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            ${sortedTiers.map((tier, index) => {
                const nextTier = sortedTiers[index + 1];
                const tierLabel = nextTier ? `${tier.pounds} - ${nextTier.pounds - 1} lbs` : `${tier.pounds}+ lbs`;
                return `
                <div class="flex items-center gap-4">
                    <label class="w-28 text-gray-600 dark:text-gray-300 font-medium text-right">${tierLabel}</label>
                    <div class="relative flex-grow">
                        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input type="number" step="0.01" min="0" value="${tier.pricePerPound}" data-pounds="${tier.pounds}" class="w-full pl-7 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-save-btn" type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2">${icons.save} Save Changes</button>
        </div>
      </form>
    </div>`;
    openModal(modalHTML);
    
    document.getElementById('edit-price-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        setButtonState('modal-save-btn', `${icons.spinner} Saving...`, true);

        const inputs = Array.from(e.target.querySelectorAll('input[type="number"]'));
        const newPriceTiers = inputs.map(input => ({
            pounds: parseInt(input.dataset.pounds),
            pricePerPound: parseFloat(input.value) || 0,
        }));
        
        const updatedProduct = { ...product, priceTiers: newPriceTiers };

        try {
            await api.updateSingleProduct(updatedProduct);
            reloadDataFromSession();
            closeModal();
        } catch (err) {
            alert('Failed to save product.'); // Simple error handling
            setButtonState('modal-save-btn', `${icons.save} Save Changes`, false);
        }
    });
};

const openPasswordModal = () => {
    const modalHTML = `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <form id="password-form" class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-sm" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Editor Access</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">${icons.close}</button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">Please enter the password to access editor functionalities.</p>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">${icons.lock}</div>
            <input id="editor-password" type="password" required autofocus class="w-full pl-10 pr-3 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" />
          </div>
          <div id="modal-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button id="modal-submit-btn" type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]">Log In</button>
        </div>
      </form>
    </div>`;
    openModal(modalHTML);
    
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('editor-password').value;
        setButtonState('modal-submit-btn', `<span class="text-white">${icons.spinner}</span>`, true);
        
        const isValid = await api.verifyPassword(password);
        if (isValid) {
            state.userRole = 'Editor';
            renderApp();
            closeModal();
        } else {
            showMessageInModal('modal-message-container', 'Incorrect password.');
            setButtonState('modal-submit-btn', 'Log In', false);
            document.getElementById('editor-password').classList.add('border-red-500', 'focus:ring-red-500');
        }
    });
};


// --- EVENT HANDLERS ---
const handleSearch = (e) => {
    state.searchTerm = e.target.value;
    document.getElementById('product-list-container').innerHTML = createProductListHTML();
};

const handleRoleChange = (e) => {
    const newRole = e.target.value;
    if (newRole === 'Editor') {
        openPasswordModal();
    } else {
        state.userRole = 'Observer';
        renderApp();
    }
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

const reloadDataFromSession = () => {
    const data = api.getFullDataState();
    state.products = data.products;
    state.logoSrc = data.logo || null;
    renderApp();
};

// --- EVENT LISTENERS SETUP ---
const attachEventListeners = () => {
    document.getElementById('search-bar')?.addEventListener('input', handleSearch);
    document.getElementById('role-selector')?.addEventListener('change', handleRoleChange);
    
    // Use event delegation on a stable parent element
    const container = appContainer.querySelector('.min-h-screen');
    container?.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const productId = button.dataset.productId;

        switch (action) {
            case 'edit-product':        openEditPriceModal(productId); break;
            case 'upload-logo':         openUploadLogoModal(); break;
            case 'change-password':     openChangePasswordModal(); break;
            case 'apply-tariffs':       openTariffModal(); break;
            case 'upload-csv':          openCsvUploadModal(); break;
            case 'upload-db':           openDbUploadModal(); break;
            case 'download-db':         handleDownloadData(); break;
        }
    });
};

// --- INITIALIZATION ---
const init = async () => {
  renderApp(); // Initial render with loading state
  try {
    await api.initializeData();
    const data = api.getFullDataState();
    state.products = data.products;
    state.logoSrc = data.logo || null;
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load application data. Please try again later.';
  } finally {
    state.isLoading = false;
    renderApp(); // Re-render with final data or error
  }
};

init();