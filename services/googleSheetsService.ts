import { Product, AppState } from './types.ts';

const SESSION_STORAGE_KEY = 'price_manager_session_data';
const DEFAULT_PASSWORD = 'admin123';

// --- Private Helper Functions ---

const getDataFromSession = (): AppState | null => {
  try {
    const storedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : null;
  } catch (error) {
    console.error("Error parsing session data", error);
    return null;
  }
};

const saveDataToSession = (data: AppState): void => {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
};

// --- Public API Functions ---

/**
 * Initializes the application data.
 * 1. Tries to fetch the master data file from the server.
 * 2. If successful, stores it in the session.
 * 3. If it fails (e.g., local development), it creates a default empty state.
 */
export const initializeData = async (): Promise<void> => {
  if (getDataFromSession()) {
    console.log("Data already initialized in session.");
    return;
  }
  
  try {
    console.log("Fetching initial data from ./server/db.json...");
    const response = await fetch('./server/db.json');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data: AppState = await response.json();
    saveDataToSession(data);
    console.log("Successfully initialized data from server file.");
  } catch (error) {
    console.warn("Could not fetch ./server/db.json. Initializing with empty state.", error);
    // Fallback for local development if server file is not available
    saveDataToSession({ products: [], password: DEFAULT_PASSWORD, logo: null });
  }
};

/**
 * Retrieves the entire current application state from the session.
 */
export const getFullDataState = (): AppState => {
    return getDataFromSession() || { products: [], password: DEFAULT_PASSWORD, logo: null };
};

/**
 * Replaces the entire application state with new data from an uploaded file.
 */
export const setFullDataState = async (data: AppState): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 250)); // Simulate async save
    saveDataToSession(data);
};


// --- Data Accessors and Mutators ---

export const fetchProducts = async (): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 250)); // Simulate network latency
  return getFullDataState().products;
};

export const updateSingleProduct = async (productToUpdate: Product): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const data = getFullDataState();
    const updatedProducts = data.products.map(p => p.id === productToUpdate.id ? productToUpdate : p);
    saveDataToSession({ ...data, products: updatedProducts });
};

export const saveAllProducts = async (newProducts: Product[]): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 250));
  const data = getFullDataState();
  saveDataToSession({ ...data, products: newProducts });
};

export const verifyPassword = async (password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const storedPassword = getFullDataState().password || DEFAULT_PASSWORD;
    return password === storedPassword;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = getFullDataState();
    const storedPassword = data.password || DEFAULT_PASSWORD;
    if (currentPassword !== storedPassword) {
        throw new Error("Current password is incorrect.");
    }
    saveDataToSession({ ...data, password: newPassword });
};

export const getLogo = (): string | null => {
    return getFullDataState().logo || null;
}

export const saveLogo = async (logoBase64: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const data = getFullDataState();
    saveDataToSession({ ...data, logo: logoBase64 });
}
