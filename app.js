
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
  spinner: `<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`
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


// --- TEMPLATE GENERATORS ---

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
  const filteredProducts = state.products.filter(p =>
    p.colorName.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return `
    <main class="container mx-auto p-4 sm:p-6 lg:p-8">
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div class="relative w-full md:w-80">
          <input id="search-bar" type="text" value="${state.searchTerm}" placeholder="Search by color name..." class="w-full px-4 py-2 text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
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
      <div id="product-list-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${state.isLoading ? `<div class="text-center p-8 text-gray-500 dark:text-gray-400 col-span-full">Loading application data...</div>` :
          state.error ? `<div class="text-center p-8 text-red-500 col-span-full">${state.error}</div>` :
          filteredProducts.length > 0 ? filteredProducts.map(createProductCardHTML).join('') :
          `<p class="text-center text-gray-500 dark:text-gray-400 mt-8 col-span-full">No products found.</p>`
        }
      </div>
    </main>
  `;
};

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

// --- RENDER FUNCTIONS ---

const renderApp = () => {
  const html = `
    ${createHeaderHTML()}
    ${createMainContentHTML()}
    <div id="modal-container"></div>
  `;
  appContainer.innerHTML = html;
  attachEventListeners();
};

const renderProductList = () => {
    const container = document.getElementById('product-list-container');
    if (!container) return;

    const filteredProducts = state.products.filter(p =>
        p.colorName.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
    
    container.innerHTML = state.isLoading ? `<div class="text-center p-8 text-gray-500 dark:text-gray-400 col-span-full">Loading application data...</div>` :
        state.error ? `<div class="text-center p-8 text-red-500 col-span-full">${state.error}</div>` :
        filteredProducts.length > 0 ? filteredProducts.map(createProductCardHTML).join('') :
        `<p class="text-center text-gray-500 dark:text-gray-400 mt-8 col-span-full">No products found.</p>`;
};

// --- MODAL HANDLING ---

const createCsvUploadModalHTML = () => {
    return `
    <div data-modal class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onclick="event.stopPropagation()">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Upload Products from CSV</h2>
          <button type="button" data-action="close-modal" class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            ${icons.close}
          </button>
        </div>
        <div class="p-6 space-y-4">
            <div class="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  This will <strong class="font-semibold">replace all current products</strong> with data from the CSV file. Your logo and editor password will not be affected.
                </p>
                <p class="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    <strong>Required Headers:</strong> <code class="font-mono text-xs bg-gray-200 dark:bg-gray-600 rounded px-1">id, colorname, price_5_24, price_25_89, price_90_499, price_500_plus</code>
                </p>
                 <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Empty price cells will be filled with the last valid price from their row.
                </p>
            </div>
            <div>
              <label for="csv-upload-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                id="csv-upload-input"
                type="file"
                accept=".csv, text/csv"
                class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
            </div>
            <div id="csv-message-container"></div>
        </div>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button id="csv-cancel-btn" type="button" data-action="close-modal" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
            Cancel
          </button>
          <button id="csv-process-btn" type="button" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2" disabled>
            Process File
          </button>
        </div>
      </div>
    </div>
  `;
};

const openCsvUploadModal = () => {
    openModal(createCsvUploadModalHTML());

    const fileInput = document.getElementById('csv-upload-input');
    const processBtn = document.getElementById('csv-process-btn');
    const cancelBtn = document.getElementById('csv-cancel-btn');
    const messageContainer = document.getElementById('csv-message-container');
    
    let selectedFile = null;

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            processBtn.disabled = false;
            messageContainer.innerHTML = ''; // Clear previous messages
        } else {
            selectedFile = null;
            processBtn.disabled = true;
        }
    });

    processBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            messageContainer.innerHTML = `<p class="text-sm text-red-500 mt-2">Please select a file to upload.</p>`;
            return;
        }

        processBtn.disabled = true;
        processBtn.innerHTML = `${icons.spinner} Processing...`;
        messageContainer.innerHTML = '';

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result;
                if (!text) throw new Error('File is empty or could not be read.');

                const lines = text.split(/\r\n|\n/);
                if (lines[0].charCodeAt(0) === 0xFEFF) { // Remove BOM
                    lines[0] = lines[0].substring(1);
                }

                const REQUIRED_HEADERS = ['id', 'colorname', 'price_5_24', 'price_25_89', 'price_90_499', 'price_500_plus'];
                const POUND_LEVELS = [5, 25, 90, 500];

                const headerRow = lines.shift()?.toLowerCase() ?? '';
                const headers = parseCsvRow(headerRow).map(h => h.replace(/"/g, '').trim());
                
                const headerMap = {};
                headers.forEach((h, i) => { headerMap[h] = i; });

                const missingHeaders = REQUIRED_HEADERS.filter(h => headerMap[h] === undefined);
                if (missingHeaders.length > 0) {
                    throw new Error(`CSV headers are incorrect or missing. Missing: [${missingHeaders.join(', ')}].`);
                }

                const newProducts = [];
                lines.forEach((line, index) => {
                    if (line.trim() === '') return;
                    
                    const values = parseCsvRow(line);
                    const priceValues = REQUIRED_HEADERS.slice(2).map(h => safeParseFloat(values[headerMap[h]]));

                    let lastValidPrice = null;
                    for (let i = 0; i < priceValues.length; i++) {
                        if (priceValues[i] !== null) {
                            lastValidPrice = priceValues[i];
                        } else if (lastValidPrice !== null) {
                            priceValues[i] = lastValidPrice;
                        }
                    }
                    if(lastValidPrice !== null) {
                        for(let i=0; i < priceValues.length; i++) {
                            if(priceValues[i] === null) priceValues[i] = lastValidPrice;
                        }
                    }

                    if (priceValues.some(p => p === null)) {
                        console.warn(`Skipping row ${index + 2}: Contains a row with no valid prices.`);
                        return;
                    }

                    const priceTiers = POUND_LEVELS.map((pounds, i) => ({
                        pounds,
                        pricePerPound: priceValues[i],
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

                await api.saveAllProducts(newProducts);
                messageContainer.innerHTML = `<p class="text-sm text-green-500 mt-2">${newProducts.length} product(s) successfully loaded from CSV.</p>`;
                cancelBtn.textContent = 'Close';
                processBtn.innerHTML = 'Process File';
                reloadDataFromSession();

            } catch (err) {
                messageContainer.innerHTML = `<p class="text-sm text-red-500 mt-2">${err.message || 'An unexpected error occurred.'}</p>`;
                 processBtn.disabled = false;
                 processBtn.innerHTML = 'Process File';
            }
        };
        reader.onerror = () => {
            messageContainer.innerHTML = `<p class="text-sm text-red-500 mt-2">Failed to read the file.</p>`;
            processBtn.disabled = false;
            processBtn.innerHTML = 'Process File';
        };
        reader.readAsText(selectedFile);
    });
};

const openModal = (modalHTML) => {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.innerHTML = modalHTML;
        const modalElement = modalContainer.querySelector('[data-modal]');
        modalElement?.addEventListener('click', (e) => {
            if (e.target === modalElement || e.target.closest('[data-action="close-modal"]')) {
                closeModal();
            }
        });
        document.addEventListener('keydown', handleEscKey);
    }
};

const closeModal = () => {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.innerHTML = '';
    }
    document.removeEventListener('keydown', handleEscKey);
};

const handleEscKey = (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
};

// --- EVENT HANDLERS ---
const handleSearch = (e) => {
    state.searchTerm = e.target.value;
    renderProductList();
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

const openPasswordModal = () => {
    // A simplified placeholder for the actual modal logic
    const password = prompt("Enter editor password:");
    if (password) {
        api.verifyPassword(password).then(isValid => {
            if (isValid) {
                state.userRole = 'Editor';
                renderApp();
            } else {
                alert('Incorrect password.');
                // Reset dropdown
                document.getElementById('role-selector').value = 'Observer';
            }
        });
    } else {
        document.getElementById('role-selector').value = 'Observer';
    }
};

// ... Other handlers for edit, save, upload modals would go here...


// --- EVENT LISTENERS SETUP ---
const attachEventListeners = () => {
    const searchBar = document.getElementById('search-bar');
    searchBar?.addEventListener('input', handleSearch);

    const roleSelector = document.getElementById('role-selector');
    roleSelector?.addEventListener('change', handleRoleChange);
    
    // Event delegation for dynamic buttons
    appContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        switch (action) {
            case 'download-db':
                handleDownloadData();
                break;
            case 'upload-csv':
                openCsvUploadModal();
                break;
            // Add cases for 'upload-db', 'edit-product', etc.
            // These would call functions to open their respective modals.
        }
    });
};

// --- INITIALIZATION ---
const init = async () => {
  state.isLoading = true;
  renderApp();

  try {
    await api.initializeData();
    const data = api.getFullDataState();
    state.products = data.products;
    state.logoSrc = data.logo || null;
    state.error = null;
  } catch (err) {
    state.error = 'Failed to load application data. Please try again later.';
    console.error(err);
  } finally {
    state.isLoading = false;
    renderApp();
  }
};

// --- START THE APP ---
init();
