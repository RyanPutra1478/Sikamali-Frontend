const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://10.12.9.188:5000/api";
const BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/regions`;

const regionsCache = new Map();
console.log('[Wilayah Cache] Module re-initialized');

async function fetchJSON(endpoint) {
  // Check cache
  if (regionsCache.has(endpoint)) {
    console.log(`[Wilayah Cache] HIT: ${endpoint}`);
    return regionsCache.get(endpoint);
  }

  console.log(`[Wilayah Cache] MISS: ${endpoint}`);
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("token-expired"));
    }
    throw new Error("Gagal memuat data wilayah");
  }
  
  const data = await response.json();
  // Store in cache
  console.log(`[Wilayah Cache] SET: ${endpoint}`);
  regionsCache.set(endpoint, data);
  return data;
}

export const wilayahAPI = {
  getProvinces: () => fetchJSON("/provinces"),
  getRegencies: (provinceId) => fetchJSON(`/regencies/${provinceId}`),
  getDistricts: (regencyId) => fetchJSON(`/districts/${regencyId}`),
  getVillages: (districtId) => fetchJSON(`/villages/${districtId}`),
  clearCache: () => regionsCache.clear(),
};
