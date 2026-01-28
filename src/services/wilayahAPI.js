const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://192.168.0.244:5000/api";
const BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/regions`;

async function fetchJSON(endpoint) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${BASE_URL}${endpoint}`, { headers });
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("token-expired"));
    }
    throw new Error("Gagal memuat data wilayah");
  }
  return response.json();
}

export const wilayahAPI = {
  getProvinces: () => fetchJSON("/provinces"),
  getRegencies: (provinceId) => fetchJSON(`/regencies/${provinceId}`),
  getDistricts: (regencyId) => fetchJSON(`/districts/${regencyId}`),
  getVillages: (districtId) => fetchJSON(`/villages/${districtId}`),
};
