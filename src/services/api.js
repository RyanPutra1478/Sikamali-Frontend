// ====================================================================
// 1. CONFIG & HELPER
// ====================================================================
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api";

console.log('[API Cache] Module re-initialized');

// --- Caching Management ---
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes default TTL

/**
 * Get data from cache or return null if expired/not found
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) {
    console.log(`[API Cache] MISS (not in map): ${key}`);
    return null;
  }
  if (Date.now() > cached.expiry) {
    console.log(`[API Cache] MISS (expired): ${key}`);
    cache.delete(key);
    return null;
  }
  console.log(`[API Cache] HIT: ${key}`);
  return cached.data;
}

/**
 * Set data to cache
 */
function setToCache(key, data, ttl = CACHE_TTL) {
  console.log(`[API Cache] SET: ${key} (TTL: ${ttl}ms)`);
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

/**
 * Invalidate specific cache key or all caches
 */
function invalidateCache(key) {
  if (key) {
    console.log(`[API Cache] INVALIDATE key: ${key}`);
    cache.delete(key);
  } else {
    console.trace(`[API Cache] CLEAR ALL CACHE`);
    cache.clear();
  }
}

// Token Refresh Management
let refreshTimer = null;
let refreshInterval = null;
let refreshPromise = null; // To prevent concurrent refresh calls
let lastActivity = Date.now();
const ACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const REFRESH_BEFORE_EXPIRY = 30 * 1000; // Refresh 30 seconds before expiry (reduced for short-lived tokens)
const REFRESH_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds as fallback

/**
 * Decode JWT token to get expiration time
 */
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[Token Refresh] Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token needs refresh and perform refresh if needed
 * @param {boolean} force - If true, skip expiry and activity checks
 */
async function checkAndRefreshToken(force = false) {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token || !refreshToken) {
    if (!force) console.log('[Token Refresh] No tokens found, skipping refresh check');
    return false;
  }

  if (!force) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      console.log('[Token Refresh] Could not decode token');
      return false;
    }

    const expiryTime = decoded.exp * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    console.log(`[Token Refresh] Token expires in ${Math.round(timeUntilExpiry / 1000)} seconds`);

    // Only refresh if token is close to expiry or already expired
    if (timeUntilExpiry > REFRESH_BEFORE_EXPIRY) {
      return false; // Token still valid, no refresh needed
    }

    // Check user activity before refreshing
    const timeSinceActivity = Date.now() - lastActivity;
    if (timeSinceActivity > ACTIVITY_TIMEOUT) {
      console.log('[Token Refresh] User inactive, skipping refresh');
      return false;
    }

    console.log('[Token Refresh] Token expiring soon, refreshing...');
  } else {
    console.log('[Token Refresh] Forced refresh triggered...');
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('[Token Refresh] ✅ Token refreshed successfully');
          return true;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Token Refresh] ❌ Failed to refresh:', errorData.error || response.status);
        
        // If refresh token is expired, trigger logout
        if (response.status === 401 || response.status === 403) {
          window.dispatchEvent(new CustomEvent('token-expired'));
        }
      }
    } catch (error) {
      console.error('[Token Refresh] ❌ Network error during refresh:', error);
    } finally {
      refreshPromise = null;
    }
    return false;
  })();

  return refreshPromise;
}

/**
 * Schedule automatic token refresh based on token expiry
 */
function scheduleTokenRefresh() {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token || !refreshToken) {
    return;
  }

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return;
  }

  // Calculate time until token expires (in milliseconds)
  const expiryTime = decoded.exp * 1000;
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  
  // Schedule refresh for 30 seconds before expiry, or immediately if already close
  const timeUntilRefresh = Math.max(timeUntilExpiry - REFRESH_BEFORE_EXPIRY, 1000);

  console.log(`[Token Refresh] Scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`);

  refreshTimer = setTimeout(async () => {
    const success = await checkAndRefreshToken();
    if (success) {
      // Schedule next refresh after successful refresh
      scheduleTokenRefresh();
    }
  }, timeUntilRefresh);
}

/**
 * Track user activity
 */
function trackActivity() {
  lastActivity = Date.now();
}

/**
 * Handle visibility change - refresh token when tab becomes visible
 */
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    console.log('[Token Refresh] Tab became visible, checking token...');
    trackActivity(); // User is active
    checkAndRefreshToken().then(refreshed => {
      if (refreshed) {
        scheduleTokenRefresh(); // Reschedule after refresh
      }
    });
  }
}

/**
 * Initialize token refresh mechanism
 */
export function initTokenRefresh() {
  // Schedule initial refresh
  scheduleTokenRefresh();

  // Start periodic check as fallback
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(() => {
    checkAndRefreshToken().then(refreshed => {
      if (refreshed) {
        scheduleTokenRefresh();
      }
    });
  }, REFRESH_CHECK_INTERVAL);

  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.addEventListener(event, trackActivity, { passive: true });
  });

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  console.log('[Token Refresh] ✅ Initialized with scheduled refresh, periodic check, and visibility trigger');
}

/**
 * Cleanup token refresh mechanism
 */
export function cleanupTokenRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }

  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    window.removeEventListener(event, trackActivity);
  });

  document.removeEventListener('visibilitychange', handleVisibilityChange);

  console.log('[Token Refresh] Cleaned up');
}


/**
 * Helper utama untuk melakukan fetch API dengan otorisasi JWT.
 * Menangani JSON otomatis, FormData, dan Caching.
 * @param {string} url - Endpoint URL
 * @param {object} options - Request options
 * @param {boolean} options.useCache - Enable caching for GET requests
 * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
 */
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const forceRefresh = options.forceRefresh || false;
  const useCache = (options.useCache !== false) && isGet; // Cache is ON by default for GET

  // Check Cache
  if (useCache && !forceRefresh) {
    const cachedData = getFromCache(url);
    if (cachedData) {
      console.log(`[API Cache] Returning cached data for: ${url}`);
      return cachedData;
    }
  }

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let requestBody = options.body;
  if (requestBody && typeof requestBody === "object" && !isFormData) {
    requestBody = JSON.stringify(requestBody);
  }

  let response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    body: requestBody,
  });

  // Handle Token Expiration
  if (!response.ok && response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    
    if (refreshToken && !url.includes('/auth/login') && !url.includes('/auth/refresh-token')) {
      try {
        // Try to refresh token using the centralized promise-tracked function
        const success = await checkAndRefreshToken(true);

        if (success) {
          const newToken = localStorage.getItem("token");
          
          // Reschedule token refresh
          scheduleTokenRefresh();
          
          // Retry original request with new token
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
            body: requestBody,
          });
          
          if (response.ok) {
            const data = response.status === 204 ? { success: true } : await response.json();
            // Store successful retry in cache if applicable
            if (useCache) setToCache(url, data);
            return data;
          }
        }
      } catch (err) {
        console.error("Auto refresh failed:", err);
      }
    }
    
    window.dispatchEvent(new CustomEvent("token-expired"));
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || "Request failed");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || "Request failed");
  }

  if (response.status === 204) {
    // Invalidate cache on mutations
    if (!isGet) invalidateCache();
    return { success: true };
  }

  const result = await response.json();

  // Store successful GET in cache
  if (useCache) {
    setToCache(url, result);
  } else if (!isGet) {
    // Invalidate all caches on POST/PUT/DELETE for simplicity
    console.log(`[API Cache] Mutation detected at ${url}, invalidating cache.`);
    invalidateCache();
  }

  return result;
}


// ====================================================================
// 2. AUTHENTICATION & USER PROFILE
// ====================================================================

const authAPI = {
  login: async (data) =>
    fetchWithAuth("/auth/login", { method: "POST", body: data }),
  register: async (data) =>
    fetchWithAuth("/auth/register", { method: "POST", body: data }),
  refreshToken: async (refreshToken) =>
    fetchWithAuth("/auth/refresh-token", { method: "POST", body: { refreshToken } }),
  logout: async (refreshToken) =>
    fetchWithAuth("/auth/logout", { method: "POST", body: { refreshToken } }),
  changePassword: async (currentPassword, newPassword) =>
    fetchWithAuth("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),
};

const profileAPI = {
  get: async () => fetchWithAuth("/profile"),
  update: async (data) =>
    fetchWithAuth("/profile", { method: "PUT", body: data }),
};

// ====================================================================
// 3. CORE FEATURES (DOCUMENTS & LAND)
// ====================================================================

const documentAPI = {
  get: async () => fetchWithAuth("/documents"),
  getAll: async () => fetchWithAuth("/documents/all"), // Admin only

  update: async (id, data) =>
    fetchWithAuth(`/documents/${id}`, { method: "PUT", body: data }),
  remove: async (id) => fetchWithAuth(`/documents/${id}`, { method: "DELETE" }),

  createKKManual: (data) =>
    fetchWithAuth("/documents/manual/kk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  importExcel: (formData) =>
    fetchWithAuth("/documents/import/excel", {
      method: "POST",
      body: formData, // FormData automatically sets Content-Type to multipart/form-data
    }),

  uploadFormData: async (formData) =>
    fetchWithAuth("/documents", {
      method: "POST",
      body: formData,
      isFormData: true,
    }),

  copy: async (id) =>
    fetchWithAuth(`/documents/${id}/copy`, { method: "POST" }),

  getFile: (filename) => {
    const token = localStorage.getItem("token");
    return `${API_BASE_URL}/documents/file/${filename}?token=${token}`;
  },
};

const landAPI = {
  get: async (options = {}) => fetchWithAuth("/land", options),
  searchKK: async (query, options = {}) => fetchWithAuth(`/land/search?q=${query}`, options),
  getKKByNomor: async (nomor_kk, options = {}) => fetchWithAuth(`/land/kk/${nomor_kk}`, options),

  create: async (data, fotoRumahFile) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined)
        formData.append(key, data[key]);
    });
    if (fotoRumahFile) formData.append("foto_rumah", fotoRumahFile);
    return fetchWithAuth("/land", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },

  update: async (id, data, fotoRumahFile) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined)
        formData.append(key, data[key]);
    });
    if (fotoRumahFile) formData.append("foto_rumah", fotoRumahFile);
    return fetchWithAuth(`/land/${id}`, {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
  },

  remove: async (id) => fetchWithAuth(`/land/${id}`, { method: "DELETE" }),
};

// ====================================================================
// 4. PUBLIC FEATURES (ANNOUNCEMENTS & COMPLAINTS)
// ====================================================================

const announcementAPI = {
  get: async (options = {}) => fetchWithAuth("/announcements", options),
  create: async (data) =>
    fetchWithAuth("/announcements", { method: "POST", body: data }),
  delete: async (id) =>
    fetchWithAuth(`/announcements/${id}`, { method: "DELETE" }),
  toggle: async (id) =>
    fetchWithAuth(`/announcements/${id}/toggle`, { method: "PUT" }),
};

const complaintAPI = {
  get: async (options = {}) => fetchWithAuth("/complaints", options),
  create: async (title, message) =>
    fetchWithAuth("/complaints", { method: "POST", body: { title, message } }),
};

const publicAPI = {
  getStats: async (desa = '') => {
    let url = "/public/stats";
    if (desa) {
      url += `?desa=${encodeURIComponent(desa)}`;
    }
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) throw new Error("Failed to fetch public stats");
    return response.json();
  },
  getVillages: async () => {
    const response = await fetch(`${API_BASE_URL}/public/villages`);
    if (!response.ok) throw new Error("Failed to fetch villages");
    return response.json();
  },
  getComparison: async (metric) => {
    const response = await fetch(`${API_BASE_URL}/public/comparison?metric=${metric}`);
    if (!response.ok) throw new Error("Failed to fetch comparison stats");
    return response.json();
  },
};

// ====================================================================
// 5. ADMIN DASHBOARD & MANAGEMENT
// ====================================================================

const adminAPI = {
  // Dashboard Stats
  getStats: async (options = {}) => fetchWithAuth("/admin/stats", options),

  // Data Tables
  getKK: async (options = {}) => fetchWithAuth("/admin/kk", options),
  getEmployment: async (options = {}) => fetchWithAuth("/admin/employment", options),
  getPrasejahtera: async (options = {}) => fetchWithAuth("/admin/kesejahteraan", options),
  getLand: async (options = {}) => fetchWithAuth("/admin/land", options),

  // Prasejahtera Actions
  createPrasejahtera: async (data) =>
    fetchWithAuth("/admin/kesejahteraan", { method: "POST", body: data }),

  updatePrasejahtera: async (id, data) =>
    fetchWithAuth(`/admin/kesejahteraan/${id}`, { method: "PUT", body: data }),

  deletePrasejahtera: async (id) =>
    fetchWithAuth(`/admin/kesejahteraan/${id}`, { method: "DELETE" }),

  // User Management (khusus superadmin di backend)
  getUsersWithKK: async () => fetchWithAuth("/admin/users-with-kk"),
  getUsers: async () => fetchWithAuth("/admin/users"),
  createUser: async (data) =>
    fetchWithAuth("/admin/users", { method: "POST", body: data }),
  deleteUser: async (id) =>
    fetchWithAuth(`/admin/users/${id}`, { method: "DELETE" }),
  updateUserRole: async (id, role) =>
    fetchWithAuth(`/admin/users/${id}/role`, { method: "PUT", body: { role } }),
  updateUserPassword: async (id, password) =>
    fetchWithAuth(`/admin/users/${id}/password`, {
      method: "PUT",
      body: { password },
    }),
  updateUser: async (id, data) =>
    fetchWithAuth(`/admin/users/${id}`, {
      method: "PUT",
      body: data,
    }),

  // Land Management (Admin)
  updateLand: async (id, data, fotoRumahFile) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined)
        formData.append(key, data[key]);
    });
    if (fotoRumahFile) formData.append("foto_rumah", fotoRumahFile);
    return fetchWithAuth(`/admin/land/${id}`, {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
  },
  deleteLand: async (id) => fetchWithAuth(`/land/${id}`, { method: "DELETE" }), // Endpoint umum

  // Employment Actions (Admin)
  deleteEmployment: async (id) =>
    fetchWithAuth(`/admin/employment/${id}`, { method: "DELETE" }),

  // UPDATE KHUSUS (BY ID) → sesuaikan dengan route: PUT /admin/employment/full/:id
  updateEmploymentFull: async (data) => {
    return fetchWithAuth(`/admin/employment/full`, {
      method: "PUT",
      body: data,
    });
  },

  // Kesejahteraan (Welfare) Management
  getKesejahteraan: async () => fetchWithAuth("/admin/kesejahteraan"),
  upsertKesejahteraan: async (data) =>
    fetchWithAuth("/admin/kesejahteraan", { method: "POST", body: data }),
  updateKesejahteraan: async (id, data) =>
    fetchWithAuth(`/admin/kesejahteraan/${id}`, { method: "PUT", body: data }),
  deleteKesejahteraan: async (id) =>
    fetchWithAuth(`/admin/kesejahteraan/${id}`, { method: "DELETE" }),
};

// ====================================================================
// 6. USER SELF-SERVICE DATA (PRASEJAHTERA & KESEJAHTERAAN)
// ====================================================================

const userServiceAPI = {
  // --- Prasejahtera ---
  searchKK: async (nomor_kk) =>
    fetchWithAuth(
      `/documents/prasejahtera/search?nomor_kk=${encodeURIComponent(nomor_kk)}`
    ),

  createOrUpdatePrasejahtera: async (data) =>
    fetchWithAuth("/documents/prasejahtera", { method: "POST", body: data }),

  getPrasejahteraList: async () =>
    fetchWithAuth("/documents/prasejahtera/list"),

  // --- Kesejahteraan (Angkatan Kerja) ---
  searchEmployment: async (nik) =>
    fetchWithAuth(
      `/documents/kesejahteraan/search?nik=${encodeURIComponent(nik)}`
    ),

  // UPDATE KHUSUS USER (BY NIK / SELF)
  updateEmployment: async (data) =>
    fetchWithAuth("/documents/kesejahteraan", {
      method: "PUT",
      body: data,
    }),

  // DELETE KHUSUS USER (Delete data sendiri)
  deleteEmployment: async (id) =>
    fetchWithAuth(`/kesejahteraan/employment/${id}`, { method: "DELETE" }),

  getKesejahteraanList: async () => fetchWithAuth("/kesejahteraan/list"),
};

// ====================================================================
// 7. KK MANAGEMENT (NEW)
// ====================================================================

const kkAPI = {
  createHeader: async (data, fotoRumahFile) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined)
        formData.append(key, data[key]);
    });
    if (fotoRumahFile) formData.append("foto_rumah", fotoRumahFile);
    return fetchWithAuth("/kk/header", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  },
  updateHeader: async (id, data, fotoRumahFile) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined)
        formData.append(key, data[key]);
    });
    if (fotoRumahFile) formData.append("foto_rumah", fotoRumahFile);
    return fetchWithAuth(`/kk/header/${id}`, {
      method: "PUT",
      body: formData,
      isFormData: true,
    });
  },
  deleteHeader: async (id) =>
    fetchWithAuth(`/kk/header/${id}`, { method: "DELETE" }),
  getDetail: async (id, options = {}) => fetchWithAuth(`/kk/${id}`, options),
  getAllMembers: async (options = {}) => fetchWithAuth("/kk/members", options),

  addMember: async (data) =>
    fetchWithAuth("/kk/members", { method: "POST", body: data }),
  updateMember: async (id, data) =>
    fetchWithAuth(`/kk/members/${id}`, { method: "PUT", body: data }),
  deleteMember: async (id) =>
    fetchWithAuth(`/kk/members/${id}`, { method: "DELETE" }),
};

const previewAPI = {
  getKK: async () => fetchWithAuth("/preview/kk"),
  getMember: async () => fetchWithAuth("/preview/member"),
};

// ====================================================================
// EXPORT ALL APIS
// ====================================================================

// Single export pattern - using named exports
export {
  // Core
  fetchWithAuth,
  invalidateCache,

  // API Modules
  authAPI,
  profileAPI,
  documentAPI,
  landAPI,
  announcementAPI,
  complaintAPI,
  adminAPI,
  publicAPI,
  userServiceAPI,
  kkAPI,
  previewAPI,

  // Constants
  API_BASE_URL as API_URL,
};

// For backward compatibility, also provide a default export
const api = {
  fetchWithAuth,
  authAPI,
  profileAPI,
  documentAPI,
  landAPI,
  announcementAPI,
  complaintAPI,
  adminAPI,
  publicAPI,
  userServiceAPI,
  kkAPI,
  previewAPI,
  API_URL: API_BASE_URL,
};

export default api;
