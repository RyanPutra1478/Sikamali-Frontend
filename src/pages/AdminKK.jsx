import React, { useEffect, useState } from "react";
import { Home, Users, Briefcase, FileText, RefreshCw as RefreshIcon, Download as FileDownloadIcon } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem, Grid, Card, Box, Tooltip, IconButton, TextField, InputAdornment, Pagination, Menu } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIconMui from "@mui/icons-material/FileDownload";
import { kkAPI, adminAPI, API_URL } from "../services/api";
import { wilayahAPI } from "../services/wilayahAPI";
import { getRolePermissions } from "../utils/permissions";
import * as XLSX from 'xlsx';
import "./AdminPage.css";

// --- HELPERS ---
const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString("id-ID") : "-";
const formatDateInput = (dateString) =>
  dateString ? new Date(dateString).toISOString().split("T")[0] : "";

// --- COMPONENT: MEMBER FORM MODAL ---
import MemberFormModal from "../components/MemberFormModal";

// --- MAIN COMPONENT ---
export default function AdminKK({ user, readOnly, canCreate, mode = "full" }) {
  // mode: 'full' (default), 'input' (create only), 'list' (list only - though DataPreview handles this)
  const [activeTab, setActiveTab] = useState(
    mode === "input" ? "create" : "list"
  );
  const [kkList, setKkList] = useState([]);
  const [selectedKK, setSelectedKK] = useState(null); // For detail view
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [fotoRumahFile, setFotoRumahFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const role = user?.role || 'user';
  const perms = getRolePermissions(role);
  const kkPerm = perms?.database?.kk || { view: false, insert: false, edit: false, delete: false };

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterValue, setFilterValue] = useState("");

  // Create Form State
  const [createForm, setCreateForm] = useState(() => {
    const lastData = localStorage.getItem('sikamali_last_kk');
    const baseForm = {
      nomor_kk: "",
      kepala_keluarga: "",
      alamat: "",
      provinsi: "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
      latitude: "",
      longitude: "",
      tanggal_diterbitkan: "",
      status_hard_copy: "BELUM ADA",
      keterangan: "",
    };
    if (lastData) {
      try {
        const parsed = JSON.parse(lastData);
        return { 
          ...baseForm, 
          alamat: parsed.alamat || "",
          provinsi: parsed.provinsi || "",
          kabupaten: parsed.kabupaten || "",
          kecamatan: parsed.kecamatan || "",
          desa: parsed.desa || "",
          zona_lingkar_tambang: parsed.zona_lingkar_tambang || ""
        };
      } catch (e) {
        return baseForm;
      }
    }
    return baseForm;
  });

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [editingKKId, setEditingKKId] = useState(null);

  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  // Member Modal State
  // Removed as member management is moved to AdminMembers.jsx

  // Wilayah State
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    loadKKList();
    loadProvinces();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterValue]);

  const loadKKList = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getKK();
      setKkList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // 1. Reset all state values related to filters and search
    setSearchTerm("");
    setFilterCategory("");
    setFilterValue("");
    setPage(1);
    
    // 2. Clear any selected items (detail dialogs, etc)
    setSelectedKK(null);
    
    // 3. Re-fetch data from API
    await loadKKList();
  };

  const loadProvinces = async () => {
    try {
      const data = await wilayahAPI.getProvinces();
      setProvinces(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProvinceChange = async (e) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex].text;
    setCreateForm({
      ...createForm,
      provinsi: provName,
      kabupaten: "",
      kecamatan: "",
      desa: "",
      zona_lingkar_tambang: "",
      ring: "",
    });
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
  };

  // --- REGION RESTORATION (FOR HISTORY/LOCALSTORAGE) ---
  useEffect(() => {
    const restoreRegencies = async () => {
      if (provinces.length > 0 && createForm.provinsi && regencies.length === 0) {
        const prov = provinces.find(p => p.name.toLowerCase() === createForm.provinsi.toLowerCase());
        if (prov) {
          try {
            const data = await wilayahAPI.getRegencies(prov.id);
            setRegencies(data);
          } catch (e) { console.error(e); }
        }
      }
    };
    restoreRegencies();
  }, [provinces, createForm.provinsi, regencies.length]);

  useEffect(() => {
    const restoreDistricts = async () => {
      if (regencies.length > 0 && createForm.kabupaten && districts.length === 0) {
        const reg = regencies.find(r => r.name.toLowerCase() === createForm.kabupaten.toLowerCase());
        if (reg) {
          try {
            const data = await wilayahAPI.getDistricts(reg.id);
            setDistricts(data);
          } catch (e) { console.error(e); }
        }
      }
    };
    restoreDistricts();
  }, [regencies, createForm.kabupaten, districts.length]);

  useEffect(() => {
    const restoreVillages = async () => {
      if (districts.length > 0 && createForm.kecamatan && villages.length === 0) {
        const dist = districts.find(d => d.name.toLowerCase() === createForm.kecamatan.toLowerCase());
        if (dist) {
          try {
            const data = await wilayahAPI.getVillages(dist.id);
            setVillages(data);
          } catch (e) { console.error(e); }
        }
      }
    };
    restoreVillages();
  }, [districts, createForm.kecamatan, villages.length]);

  const handleRegencyChange = async (e) => {
    const regId = e.target.value;
    const regName = e.target.options[e.target.selectedIndex].text;
    setCreateForm({
      ...createForm,
      kabupaten: regName,
      kecamatan: "",
      desa: "",
      zona_lingkar_tambang: "",
      ring: "",
    });
    setDistricts([]);
    setVillages([]);
  };

  // Filter Options (used for the filter selects)
  const uniqueDesa = [
    ...new Set(kkList.map((item) => item.desa).filter(Boolean)),
  ].sort();
  const uniqueKecamatan = [
    ...new Set(kkList.map((item) => item.kecamatan).filter(Boolean)),
  ].sort();
  const uniqueZona = [
    ...new Set(kkList.map((item) => item.zona_lingkar_tambang).filter(Boolean)),
  ].sort();

  const filteredKK = kkList.filter((kk) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (kk.nomor_kk && kk.nomor_kk.includes(searchLower)) ||
      (kk.kepala_keluarga &&
        kk.kepala_keluarga.toLowerCase().includes(searchLower)) ||
      (kk.alamat && kk.alamat.toLowerCase().includes(searchLower));

    if (!matchesSearch) return false;

    if (!filterCategory || !filterValue) return true;

    if (filterCategory === "Desa") return kk.desa === filterValue;
    if (filterCategory === "Kecamatan") return kk.kecamatan === filterValue;
    if (filterCategory === "Zona Lingkar")
      return kk.zona_lingkar_tambang === filterValue;

    return true;
  });

  const handleDistrictChange = async (e) => {
    const distId = e.target.value;
    const distName = e.target.options[e.target.selectedIndex].text;
    setCreateForm({
      ...createForm,
      kecamatan: distName,
      desa: "",
      zona_lingkar_tambang: "",
      ring: "",
    });
    setVillages([]);
  };

  const handleVillageChange = (e) => {
    const villageName = e.target.options[e.target.selectedIndex].text;
    const zona = determineZona(
      villageName,
      createForm.kabupaten,
      createForm.provinsi
    );
    setCreateForm({
      ...createForm,
      desa: villageName,
      zona_lingkar_tambang: zona,
    });
  };

  // MAPPING ZONA OTOMATIS BERDASARKAN GAMBAR
  const determineZona = (desa, kabupaten, provinsi) => {
    // Normalisasi: Huruf kecil, hapus strip/hyphen jadi spasi, hapus spasi berlebih
    const normalize = (str) => 
      (str || "").toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();

    const d = normalize(desa);
    const k = normalize(kabupaten);
    const p = normalize(provinsi);

    // RING 1
    const ring1 = [
      "muara lapao pao",
      "lapao pao",
      "samaenre",
      "ponre",
      "uluwolo",
      "wolo",
    ];
    if (ring1.some((r) => d.includes(r))) return "RING 1";

    // RING 2
    const ring2 = [
      "donggala",
      "ulu lapao pao",
      "langgomali",
      "lalonggopi",
      "iwoimopuro",
      "lalonaha",
      "lana",
      "ulu rina",
    ];
    if (ring2.some((r) => d.includes(r))) return "RING 2";

    // RING 3 (Kabupaten Kolaka)
    if (k.includes("kolaka")) return "RING 3";

    // RING 4 (Sulawesi)
    const sulawesiProvinces = [
      "sulawesi tenggara",
      "sulawesi selatan",
      "sulawesi tengah",
      "sulawesi utara",
      "sulawesi barat",
      "gorontalo",
    ];
    if (sulawesiProvinces.some((prov) => p.includes(prov))) return "RING 4";

    // RING 5 (Luar Sulawesi)
    if (p && !sulawesiProvinces.some((prov) => p.includes(prov)))
      return "RING 5";

    return "";
  };

  // --- ACTIONS ---

  const getInitialKKForm = () => {
    const lastData = localStorage.getItem('sikamali_last_kk');
    const baseForm = {
      nomor_kk: "",
      kepala_keluarga: "",
      alamat: "",
      provinsi: "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
      latitude: "",
      longitude: "",
      tanggal_diterbitkan: "",
      status_hard_copy: "BELUM ADA",
      keterangan: "",
      zona_lingkar_tambang: "",
    };
    if (lastData) {
      try {
        const parsed = JSON.parse(lastData);
        return { 
          ...baseForm, 
          alamat: parsed.alamat || "",
          provinsi: parsed.provinsi || "",
          kabupaten: parsed.kabupaten || "",
          kecamatan: parsed.kecamatan || "",
          desa: parsed.desa || "",
          zona_lingkar_tambang: parsed.zona_lingkar_tambang || ""
        };
      } catch (e) {
        return baseForm;
      }
    }
    return baseForm;
  };

  const handleCreateHeader = async (e) => {
    e.preventDefault();
    try {
      await kkAPI.createHeader(createForm, fotoRumahFile);
      
      // Save non-unique data to history
      localStorage.setItem('sikamali_last_kk', JSON.stringify({
        alamat: createForm.alamat,
        provinsi: createForm.provinsi,
        kabupaten: createForm.kabupaten,
        kecamatan: createForm.kecamatan,
        desa: createForm.desa,
        zona_lingkar_tambang: createForm.zona_lingkar_tambang
      }));

      setSuccessDialogOpen(true);

      const refreshedForm = getInitialKKForm();

      if (mode === "input") {
        setCreateForm(refreshedForm);
      } else {
        setActiveTab("list");
        loadKKList();
        setCreateForm(refreshedForm);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditKKHeader = async (kk) => {
    // Populate form with existing data
    // Note: We need to handle the region dropdowns.
    // Ideally we should fetch the full detail to get IDs if they are not in the list object.
    // But for now let's try to populate with what we have.
    // If names match, the dropdowns might work if we set the value to ID found by name.
    // However, we need to load the regions first if they are not loaded.
    // Provinces are loaded on mount.
    // We need to trigger change handlers to load sub-regions?
    // Or just set the form values (names) and let the user re-select if they want to change.
    // The form uses IDs for value but we store names in createForm?
    // Wait, createForm stores names: `provinsi: provName`.
    // And the select value logic I added: `value = { provinces.find(p => p.name === createForm.provinsi)?.id || '' }`
    // So if I set `createForm.provinsi` to the name from `kk.provinsi`, it should work!
    // But I also need to load the sub-regions (regencies, etc) so the dropdowns are populated.

    setEditingKKId(kk.id);
    setCreateForm({
      nomor_kk: kk.nomor_kk,
      kepala_keluarga: kk.kepala_keluarga,
      alamat: kk.alamat,
      provinsi: kk.provinsi,
      kabupaten: kk.kabupaten,
      kecamatan: kk.kecamatan,
      desa: kk.desa,
      zona_lingkar_tambang: kk.zona_lingkar_tambang,
      tanggal_diterbitkan: formatDateInput(kk.tanggal_diterbitkan),
      status_hard_copy: kk.status_hard_copy || "Tidak Ada",
      keterangan: kk.keterangan || "",
      latitude: kk.latitude || kk.lat || kk.lp_lat || "",
      longitude: kk.longitude || kk.lng || kk.lp_lng || "",
      foto_rumah: kk.foto_rumah || null,
    });
    setFotoRumahFile(null);
    setPhotoPreview(null);

    // Dependent regions (regencies, districts, villages) will be 
    // automatically fetched by the useEffect hooks because 
    // their corresponding labels are now set in createForm and 
    // the current lists are likely empty or will be cleared.
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    setActiveTab("create"); // Reuse create tab for editing
  };

  const handleUpdateHeader = async (e) => {
    e.preventDefault();
    try {
      await kkAPI.updateHeader(editingKKId, createForm, fotoRumahFile);
      alert("Data KK berhasil diupdate");
      setActiveTab("list");
      setEditingKKId(null);
      setCreateForm({
        nomor_kk: "",
        kepala_keluarga: "",
        alamat: "",
        provinsi: "",
        kabupaten: "",
        kecamatan: "",
        desa: "",
        zona_lingkar_tambang: "",
        latitude: "",
        longitude: "",
      });
      setFotoRumahFile(null);
      setPhotoPreview(null);
      loadKKList();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetail = async (kkId) => {
    try {
      const detail = await kkAPI.getDetail(kkId);
      setSelectedKK(detail);
      setActiveTab("detail");
    } catch (err) {
      alert(err.message);
    }
  };

  // Member management handlers removed as they are moved to AdminMembers.jsx

  const handleDeleteKK = async (id) => {
    if (
      !window.confirm(
        "Hapus Kartu Keluarga ini? SEMUA DATA ANGGOTA AKAN TERHAPUS!"
      )
    )
      return;
    try {
      await kkAPI.deleteHeader(id);
      loadKKList();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportExcel = (exportFiltered) => {
    const sourceData = exportFiltered ? filteredKK : kkList;
    if (sourceData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = sourceData.map((row, index) => ({
      'No': index + 1,
      'NO KARTU KELUARGA': row.nomor_kk,
      'Kepala Keluarga': row.kepala_keluarga,
      'Alamat': row.alamat,
      'Desa/Kelurahan': row.desa || '-',
      'Kecamatan': row.kecamatan || '-',
      'Kabupaten/Kota': row.kabupaten || '-',
      'Provinsi': row.provinsi || '-',
      'Zona Lingkar Tambang': row.zona_lingkar_tambang || '-',
      'Latitude': row.latitude || row.lat || '-',
      'Longitude': row.longitude || row.lng || '-',
      'Tanggal Diterbitkan': row.tanggal_diterbitkan ? new Date(row.tanggal_diterbitkan).toLocaleDateString("id-ID") : '-',
      'Status Hard Copy': row.status_hard_copy || "BELUM ADA",
      'Keterangan': row.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data KK");
    XLSX.writeFile(wb, `Data_KK_${new Date().getTime()}.xlsx`);
    setExportMenuAnchor(null);
  };

  // No redundant unique variables here

  // Extract unique options for filters (already declared above)
  const desaOptions = uniqueDesa;
  const zonaOptions = ["RING 1", "RING 2", "RING 3"];

  // Pagination Logic
  const totalPages = Math.ceil(filteredKK.length / itemsPerPage);
  const paginatedKK = filteredKK.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-title-section">
          <h2><Home size={28} /> Manajemen Kartu Keluarga</h2>
          <p className="header-subtitle">
            Daftar lengkap Kartu Keluarga, pemetaan zona lingkar tambang, dan integrasi statistik kependudukan.
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Tooltip title="Refresh Data">
            <IconButton 
              type="button"
              onClick={() => handleRefresh()} 
              sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1 }}
            >
              <RefreshIcon size={20} color="#10b981" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Excel">
            <IconButton 
              onClick={(e) => setExportMenuAnchor(e.currentTarget)} 
              sx={{ bgcolor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', p: 1 }}
            >
              <FileDownloadIconMui size={20} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={exportMenuAnchor}
            open={openExportMenu}
            onClose={() => setExportMenuAnchor(null)}
            PaperProps={{
              sx: {
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: 3,
                mt: 1,
                border: '1px solid #e2e8f0'
              }
            }}
          >
            <MenuItem onClick={() => handleExportExcel(true)} sx={{ fontWeight: 600, color: '#1e293b', gap: 1 }}>
              <FileDownloadIcon size={18} /> Export Terfilter ({filteredKK.length})
            </MenuItem>
            <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
              <Users size={18} /> Export Semua ({kkList.length})
            </MenuItem>
          </Menu>

          {mode === "full" && activeTab === "list" && kkPerm.insert && (
            <button
              className="btn-add-data"
              onClick={() => setActiveTab("create")}
            >
              + Input KK Baru
            </button>
          )}
          {mode === "full" && activeTab !== "list" && (
            <button
              className="btn-secondary"
              onClick={() => setActiveTab("list")}
            >
              Kembali ke List
            </button>
          )}
        </div>
      </div>

      {activeTab === "list" && (
        <>
          {/* TOOLBAR */}
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              bgcolor: "#fcfcfc",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
                flex: 1,
              }}
            >
              <TextField
                size="small"
                placeholder="Cari Nomor KK / Kepala Keluarga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: { xs: "100%", md: 300 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "white",
                    "& fieldset": { borderColor: "#e0e0e0" },
                    "&:hover fieldset": { borderColor: "#00AEEF" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* FILTER CATEGORY */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter By</InputLabel>
                <Select
                  value={filterCategory}
                  label="Filter By"
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterValue("");
                  }}
                  sx={{ borderRadius: 3, bgcolor: "white" }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value="Desa">Desa</MenuItem>
                  <MenuItem value="Kecamatan">Kecamatan</MenuItem>
                  <MenuItem value="Zona Lingkar">Zona Lingkar</MenuItem>
                </Select>
              </FormControl>

              {/* FILTER VALUE */}
              {filterCategory && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Select Value</InputLabel>
                  <Select
                    value={filterValue}
                    label="Select Value"
                    onChange={(e) => setFilterValue(e.target.value)}
                    sx={{ borderRadius: 3, bgcolor: "white" }}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {filterCategory === "Desa" &&
                      uniqueDesa.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    {filterCategory === "Kecamatan" &&
                      uniqueKecamatan.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    {filterCategory === "Zona Lingkar" &&
                      uniqueZona.map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Tooltip title="Filter List">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <div
            className="table-container"
            style={{ position: "relative", width: "100%" }}
          >
            <table
              className="modern-table"
              style={{
                minWidth: "2000px",
                tableLayout: "fixed",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: "50px", textAlign: "center", fontSize: "0.8rem", fontWeight: "800" }}>NO</th>
                  <th style={{ width: "180px", fontSize: "0.8rem", fontWeight: "800" }}>No Kartu Keluarga</th>
                  <th style={{ width: "220px", fontSize: "0.8rem", fontWeight: "800" }}>KEPALA KELUARGA</th>
                  <th style={{ width: "250px", fontSize: "0.8rem", fontWeight: "800" }}>ALAMAT</th>
                  <th style={{ width: "180px", fontSize: "0.8rem", fontWeight: "800" }}>DESA/ KELURAHAN</th>
                  <th style={{ width: "180px", fontSize: "0.8rem", fontWeight: "800" }}>KECAMATAN</th>
                  <th style={{ width: "180px", fontSize: "0.8rem", fontWeight: "800" }}>KABUPATEN/ KOTA</th>
                  <th style={{ width: "150px", fontSize: "0.8rem", fontWeight: "800" }}>PROVINSI</th>
                  <th style={{ width: "220px", textAlign: "left", fontSize: "0.8rem", fontWeight: "800" }}>
                    ZONA LINGKAR TAMBANG
                  </th>
                  <th style={{ width: "180px", textAlign: "left", fontSize: "0.8rem", fontWeight: "800" }}>
                    KOORDINAT
                  </th>
                  <th style={{ width: "220px", textAlign: "left", fontSize: "0.8rem", fontWeight: "800" }}>
                    TANGGAL KK DITERBITKAN
                  </th>
                  <th style={{ width: "200px", textAlign: "left", fontSize: "0.8rem", fontWeight: "800" }}>
                    STATUS HARD COPY KK
                  </th>
                  <th style={{ width: "200px", fontSize: "0.8rem", fontWeight: "800" }}>KETERANGAN</th>
                  <th style={{ width: "100px", textAlign: "center", fontSize: "0.8rem", fontWeight: "800" }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {paginatedKK.length > 0 ? (
                  paginatedKK.map((kk, index) => (
                    <tr key={kk.id}>
                      <td style={{ textAlign: "center", fontSize: "0.75rem" }}>
                        {(page - 1) * itemsPerPage + index + 1}
                      </td>
                      <td style={{ fontSize: "0.75rem" }}>
                        {kk.nomor_kk}
                      </td>
                      <td style={{ fontSize: "0.75rem" }}>
                        {kk.kepala_keluarga}
                      </td>
                      <td style={{ fontSize: "0.75rem" }}>{kk.alamat}</td>
                      <td style={{ fontSize: "0.75rem" }} className="nowrap-cell">{kk.desa}</td>
                      <td style={{ fontSize: "0.75rem" }} className="nowrap-cell">{kk.kecamatan}</td>
                      <td style={{ fontSize: "0.75rem" }} className="nowrap-cell">{kk.kabupaten}</td>
                      <td style={{ fontSize: "0.75rem" }} className="nowrap-cell">{kk.provinsi}</td>
                      <td style={{ textAlign: "left" }}>
                        <span
                          style={{
                            color: (() => {
                              const z = (kk.zona_lingkar_tambang || "").toUpperCase();
                              if (z.includes("RING 1")) return "#3b82f6";
                              if (z.includes("RING 2")) return "#10b981";
                              if (z.includes("RING 3")) return "#000000";
                              if (z.includes("RING 4")) return "#ef4444";
                              return "inherit";
                            })()
                          }}
                        >
                          {kk.zona_lingkar_tambang || "-"}
                        </span>
                      </td>
                      <td style={{ textAlign: "left", fontSize: "0.75rem", color: "#64748b" }}>
                        {(kk.latitude || kk.lat || kk.lp_lat) && (kk.longitude || kk.lng || kk.lp_lng) ? (
                          `${parseFloat(kk.latitude || kk.lat || kk.lp_lat)}, ${parseFloat(kk.longitude || kk.lng || kk.lp_lng)}`
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ fontSize: "0.75rem", textAlign: "left" }}>
                        {formatDate(kk.tanggal_diterbitkan)}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        <span>
                          {kk.status_hard_copy || "BELUM ADA"}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={kk.keterangan}
                      >
                        {kk.keterangan || "-"}
                      </td>
                      <td>
                        <div
                          className="action-buttons"
                          style={{ justifyContent: "center" }}
                        >
                          <button
                            className="btn-icon view"
                            onClick={() => handleViewDetail(kk.id)}
                            title="Lihat Detail"
                          >
                            <VisibilityIcon fontSize="small" />
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                className="btn-icon edit"
                                onClick={() => handleEditKKHeader(kk)}
                                title="Edit KK"
                              >
                                <EditIcon fontSize="small" />
                              </button>
                                {kkPerm.delete && (
                                  <button
                                    className="btn-icon delete"
                                    onClick={() => handleDeleteKK(kk.id)}
                                    title="Hapus KK"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </button>
                                )}
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="no-data">
                      Tidak ada data ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <Box
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "center",
                bgcolor: "#fcfcfc",
                borderTop: "1px solid rgba(0,0,0,0.05)",
                mt: 1,
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, v) => setPage(v)}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
                sx={{
                  "& .MuiPaginationItem-root": {
                    fontWeight: 600,
                    borderRadius: "8px",
                  },
                  "& .Mui-selected": {
                    bgcolor: "#10b981 !important",
                    color: "white",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}

      {activeTab === "create" && (
        <div className="form-container">
          <h3>
            {editingKKId
              ? "Edit Data Kartu Keluarga"
              : "Input KK Baru (Header)"}
          </h3>
          <form
            onSubmit={editingKKId ? handleUpdateHeader : handleCreateHeader}
          >
            <div className="form-row">
              <div className="form-group">
                <label>Nomor KK *</label>
                <input
                  value={createForm.nomor_kk}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, nomor_kk: e.target.value })
                  }
                  required
                  maxLength="16"
                />
              </div>
              <div className="form-group">
                <label>Kepala Keluarga *</label>
                <input
                  value={createForm.kepala_keluarga}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      kepala_keluarga: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>
            {/* Address Fields */}
            <div className="form-group">
              <label>Alamat</label>
              <textarea
                value={createForm.alamat}
                onChange={(e) =>
                  setCreateForm({ ...createForm, alamat: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Provinsi</label>
                <select
                  onChange={handleProvinceChange}
                  value={
                    provinces.find((p) => p.name === createForm.provinsi)?.id ||
                    ""
                  }
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Kabupaten</label>
                <select
                  onChange={handleRegencyChange}
                  disabled={!regencies.length}
                  value={
                    regencies.find((r) => r.name === createForm.kabupaten)
                      ?.id || ""
                  }
                >
                  <option value="">Pilih Kabupaten</option>
                  {regencies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Kecamatan</label>
                <select
                  onChange={handleDistrictChange}
                  disabled={!districts.length}
                  value={
                    districts.find((d) => d.name === createForm.kecamatan)
                      ?.id || ""
                  }
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Desa</label>
                <select
                  onChange={handleVillageChange}
                  disabled={!villages.length}
                  value={
                    villages.find((v) => v.name === createForm.desa)?.id || ""
                  }
                >
                  <option value="">Pilih Desa</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zona Lingkar Tambang & Koordinat */}
            <div className="form-row">
              <div className="form-group">
                <label>Zona Lingkar Tambang (Otomatis)</label>
                <input
                  value={createForm.zona_lingkar_tambang}
                  readOnly
                  placeholder="Terisi otomatis berdasarkan Lokasi"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-5.1234"
                    value={createForm.latitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      const hasCoords = val && createForm.longitude;
                      setCreateForm({ ...createForm, latitude: val });
                      if (!hasCoords) {
                        setFotoRumahFile(null);
                        setPhotoPreview(null);
                      }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="119.1234"
                    value={createForm.longitude}
                    onChange={(e) => {
                      const val = e.target.value;
                      const hasCoords = createForm.latitude && val;
                      setCreateForm({ ...createForm, longitude: val });
                      if (!hasCoords) {
                        setFotoRumahFile(null);
                        setPhotoPreview(null);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tanggal KK Diterbitkan</label>
                <input
                  type="date"
                  value={createForm.tanggal_diterbitkan}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      tanggal_diterbitkan: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status Hard Copy KK</label>
                <select
                  value={createForm.status_hard_copy}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      status_hard_copy: e.target.value,
                    })
                  }
                >
                  <option value="LENGKAP">LENGKAP</option>
                  <option value="BELUM ADA">BELUM ADA</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Foto Rumah</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!createForm.latitude || !createForm.longitude}
                  title={!createForm.latitude || !createForm.longitude ? "Tolong isi titik koordinat terlebih dahulu" : ""}
                  style={{ 
                    cursor: (!createForm.latitude || !createForm.longitude) ? "not-allowed" : "pointer",
                    opacity: (!createForm.latitude || !createForm.longitude) ? 0.6 : 1
                  }}
                  onChange={(e) => {
                    if (!createForm.latitude || !createForm.longitude) {
                      alert("Tolong isi titik koordinat (Latitude & Longitude) terlebih dahulu sebelum mengupload foto rumah.");
                      e.target.value = ""; // Reset file input
                      return;
                    }
                    const file = e.target.files[0];
                    if (file) {
                      setFotoRumahFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setPhotoPreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {(photoPreview || (editingKKId && createForm.foto_rumah)) && (
                  <img
                    src={photoPreview || `${API_URL}/land/photo/${createForm.foto_rumah}`}
                    alt="Preview Rumah"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "2px solid #10b981",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Keterangan</label>
              <textarea
                value={createForm.keterangan}
                onChange={(e) =>
                  setCreateForm({ ...createForm, keterangan: e.target.value })
                }
                rows="2"
              />
            </div>

            <div
              className="form-actions"
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              {editingKKId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setActiveTab("list");
                    setEditingKKId(null);
                    setCreateForm({
                      nomor_kk: "",
                      kepala_keluarga: "",
                      alamat: "",
                      provinsi: "",
                      kabupaten: "",
                      kecamatan: "",
                      desa: "",
                      zona_lingkar_tambang: "",
                      tanggal_diterbitkan: "",
                      status_hard_copy: "BELUM ADA",
                      keterangan: "",
                      latitude: "",
                      longitude: "",
                    });
                  }}
                >
                  Batal
                </button>
              )}
              <button type="submit" className="btn-save" disabled={loading}>
                {loading
                  ? "Menyimpan..."
                  : editingKKId
                  ? "Update Data KK"
                  : "Simpan Data KK"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUCCESS DIALOG */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
      >
        <DialogTitle
          sx={{
            bgcolor: "#e8f5e9",
            color: "#2e7d32",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleIcon /> Berhasil
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>Data Kartu Keluarga berhasil disimpan!</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Silakan lanjutkan untuk mengisi data anggota keluarga.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSuccessDialogOpen(false)}
            variant="contained"
            color="primary"
          >
            Lanjut Input Anggota
          </Button>
        </DialogActions>
      </Dialog>

      {activeTab === "detail" && selectedKK && (
        <div
          className="detail-view-container"
          style={{ animation: "fadeIn 0.5s ease" }}
        >
          <div
            className="detail-header-card"
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "2rem",
              boxShadow: "var(--shadow-md)",
              marginBottom: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
              {selectedKK.foto_rumah && (
                <div className="detail-photo">
                   <img 
                    src={`${API_Base_URL || API_URL}/land/photo/${selectedKK.foto_rumah}`} 
                    alt="Foto Rumah" 
                    style={{
                        width: '240px',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        border: '4px solid #f1f5f9',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                   />
                </div>
              )}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#1e293b" }}>
                      Kartu Keluarga No. {selectedKK.nomor_kk}
                    </h2>
                    <p style={{ color: "#64748b", marginTop: "0.5rem" }}>
                      Kepala Keluarga: <strong>{selectedKK.kepala_keluarga}</strong>
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={() => setActiveTab("list")}
                  >
                    &larr; Kembali
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.5rem",
              }}
            >
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Alamat
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.alamat}</div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Desa / Kelurahan
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.desa}</div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Kecamatan
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.kecamatan}</div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Kabupaten
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.kabupaten}</div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Provinsi
                </label>
                <div style={{ fontWeight: 500 }}>{selectedKK.provinsi}</div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Zona Lingkar Tambang
                </label>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    className={`status-badge-lg ${
                      selectedKK.zona_lingkar_tambang === "Ring 1"
                        ? "status-danger"
                        : "status-success"
                    }`}
                  >
                    {selectedKK.zona_lingkar_tambang || "-"}
                  </span>
                  {selectedKK.ring && (
                    <span className="kk-badge">RING {selectedKK.ring}</span>
                  )}
                </div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Koordinat (Lat, Lng)
                </label>
                <div style={{ fontWeight: 500 }}>
                  {(selectedKK.latitude || selectedKK.lat || selectedKK.lp_lat) && (selectedKK.longitude || selectedKK.lng || selectedKK.lp_lng) 
                    ? `${selectedKK.latitude || selectedKK.lat || selectedKK.lp_lat}, ${selectedKK.longitude || selectedKK.lng || selectedKK.lp_lng}` 
                    : "Belum Terdata"}
                </div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Tanggal Diterbitkan
                </label>
                <div style={{ fontWeight: 500 }}>
                  {formatDate(selectedKK.tanggal_diterbitkan)}
                </div>
              </div>
              <div className="info-item">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Status Hard Copy KK
                </label>
                <span
                  className={`status-badge ${
                    selectedKK.status_hard_copy === "LENGKAP"
                      ? "status-success"
                      : "status-pending"
                  }`}
                >
                  {selectedKK.status_hard_copy || "BELUM ADA"}
                </span>
              </div>
              <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Keterangan
                </label>
                <div
                  style={{
                    fontWeight: 400,
                    color: "#4b5563",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedKK.keterangan || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="members-list-section">
            <h3
              style={{
                fontSize: "1.25rem",
                marginBottom: "1rem",
                color: "#1e293b",
              }}
            >
              Daftar Anggota Keluarga
            </h3>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>No</th>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>NIK</th>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Nama Lengkap</th>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Jenis Kelamin</th>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Hubungan</th>
                    <th style={{ fontSize: "0.8rem", fontWeight: "800" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedKK.members && selectedKK.members.length > 0 ? (
                    selectedKK.members.map((member, index) => (
                      <tr key={member.id}>
                        <td style={{ fontSize: "0.75rem" }}>{index + 1}</td>
                        <td style={{ fontSize: "0.75rem" }}>{member.nik}</td>
                        <td>
                          <div className="user-cell">
                            <span className="username-text" style={{ fontSize: '0.75rem', fontWeight: '600' }}>{member.nama}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          <span style={{ 
                            fontWeight: '700',
                            color: member.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? '#075985' : '#991b1b'
                          }}>
                            {member.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? "LAKI-LAKI" : (member.jenis_kelamin?.toString().toUpperCase().startsWith('P') ? "PEREMPUAN" : "-")}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.75rem" }}>
                          <span className="kk-badge" style={{ fontSize: "0.75rem" }}>
                            {member.hubungan_keluarga}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                              fontSize: "0.75rem", 
                              fontWeight: "700",
                              color: "#000000"
                          }}>
                              {member.status_domisili || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        Belum ada anggota keluarga terdaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
