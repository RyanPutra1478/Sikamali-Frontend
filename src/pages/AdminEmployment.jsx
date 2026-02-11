import React, { useState, useEffect } from 'react';
import { Briefcase, RefreshCw as RefreshIcon, Download as FileDownloadIcon, Users } from 'lucide-react';
import { adminAPI, kkAPI } from '../services/api';
import { getRolePermissions } from '../utils/permissions';
import './AdminTables.css';
import './AdminPage.css';
import './AdminPrasejahtera.css'; // Import premium styles
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Box, Tooltip, IconButton, Pagination, Menu } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadIconMui from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

// --- HELPER ---
const RequiredMark = () => <span className="required-mark">*</span>;

const calculateAge = (dob) => {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birthDate.getTime())) return '-';
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

// --- COMPONENT: OVERLAY ANIMASI ---
const SubmitOverlay = ({ status }) => {
  if (status === 'idle') return null;
  return (
    <div className="submit-overlay">
      <div className="submit-content">
        {status === 'loading' && (
          <>
            <div className="spinner" />
            <h3>Menyimpan Perubahan...</h3>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="checkmark-circle">
              <span className="checkmark">✓</span>
            </div>
            <h3>Berhasil!</h3>
          </>
        )}
      </div>
    </div>
  );
};

export default function AdminEmployment({ user, readOnly, canCreate }) {
  // Ambil user dari props ATAU dari localStorage
  let storedUser = null;
  try {
    storedUser = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    storedUser = null;
  }

  const role = user?.role || storedUser?.role || 'user';
  const perms = getRolePermissions(role);

  const employmentPerm = perms?.database?.employment || {
    view: false,
    insert: false,
    edit: false,
    delete: false,
    copy: false,
    export: false,
  };

  const isReadOnlyMode = readOnly || !employmentPerm.edit;

  // Kalau tidak punya izin view sama sekali
  if (!employmentPerm.view) {
    return (
      <div className="admin-page-container">
        <div className="admin-header">
          <div>
            <p className="section-label">Profil Ketenagakerjaan</p>
            <h2>Data Angkatan Kerja</h2>
          </div>
        </div>
        <p style={{ marginTop: '1rem', color: '#6b7280' }}>
          Anda tidak memiliki akses untuk melihat data angkatan kerja.
        </p>
      </div>
    );
  }

  // ====== STATE ======
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  // SEARCH PENDUDUK STATE
  const [allResidents, setAllResidents] = useState([]);
  const [residentSearchTerm, setResidentSearchTerm] = useState('');
  const [residentSuggestions, setResidentSuggestions] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);

  // VIEW MODE: 'list' | 'create'
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    loadData();
    loadResidents();
  }, []);

  const loadResidents = async () => {
    try {
      const [membersData, kkData] = await Promise.all([
        kkAPI.getAllMembers(),
        adminAPI.getKK()
      ]);

      const merged = membersData.map(m => {
        const kk = kkData.find(k => k.id === m.kk_id || k.nomor_kk === m.nomor_kk) || {};
        return {
          ...m,
          nomor_kk: m.kk_nomor || kk.nomor_kk || m.nomor_kk || '-',
          kepala_keluarga: m.kk_kepala || kk.kepala_keluarga || m.kepala_keluarga || '',
          desa: kk.desa || m.desa || '',
          kecamatan: kk.kecamatan || m.kecamatan || ''
        };
      });
      setAllResidents(merged);
    } catch (err) {
      console.error("Error loading residents:", err);
    }
  };

  const handleResidentSearch = (term) => {
    if (!!editItem.id) return; // Disable search in edit mode
    
    setResidentSearchTerm(term);
    setEditItem(prev => ({ ...prev, nik: term }));
    setSelectedResident(null);

    if (term.length > 1) {
      const results = allResidents.filter(r =>
        (r.nik && r.nik.includes(term)) ||
        (r.nama && r.nama.toLowerCase().includes(term.toLowerCase()))
      );
      setResidentSuggestions(results.slice(0, 5));
    } else {
      setResidentSuggestions([]);
    }
  };

  const selectResident = (res) => {
    setSelectedResident(res);
    setResidentSearchTerm(`${res.nama} (${res.nik})`);
    setResidentSuggestions([]);
    setEditItem(prev => ({
      ...prev,
      nik: res.nik,
      nama: res.nama,
      nomor_kk: res.nomor_kk,
      kepala_keluarga: res.kepala_keluarga,
      alamat: res.alamat || res.alamat_kk || '',
      desa: res.desa,
      kecamatan: res.kecamatan,
      tanggal_lahir: res.tanggal_lahir,
      pendidikan_terakhir: res.pendidikan || res.pendidikan_terakhir || '',
      status_kerja: res.pekerjaan || res.status_kerja || '',
      tempat_bekerja: res.tempat_bekerja || '',
      no_hp_wa: res.no_hp || res.no_hp_wa || '',
      email: res.email || ''
    }));
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getEmployment();
      setDataList(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterValue('');
    setPage(1);
    loadData();
  };

  const handleExportExcel = (exportFiltered) => {
    const sourceData = exportFiltered ? filteredList : dataList;
    if (sourceData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = sourceData.map((item, index) => ({
      'No': index + 1,
      'No KK': item.nomor_kk || '-',
      'Kepala Keluarga': item.kepala_keluarga || '-',
      'Nama': item.nama,
      'NIK': item.nik,
      'Status Kerja': getComputedStatus(item),
      'Tempat Bekerja': item.tempat_bekerja || '-',
      'Skill': item.skill_tags || item.skill || '-',
      'Pendidikan': item.pendidikan_terakhir || item.pendidikan || '-',
      'Alamat': item.alamat || item.alamat_kk || '-',
      'Desa': item.desa || '-',
      'Kecamatan': item.kecamatan || '-',
      'Telepon': item.telepon || '-',
      'Email': item.email || '-',
      'Keterangan': item.keterangan || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Angkatan Kerja");
    XLSX.writeFile(wb, `Data_Angkatan_Kerja_${new Date().getTime()}.xlsx`);
    setExportMenuAnchor(null);
  };

  const getInitialEmploymentForm = (item = null) => {
    const lastData = localStorage.getItem('sikamali_last_employment');
    const parsed = lastData ? JSON.parse(lastData) : {};

    return {
      id: item?.id || null,
      nik: item?.nik || '',
      nama: item?.nama || '',
      nomor_kk: item?.nomor_kk || '',
      kepala_keluarga: item?.kepala_keluarga || '',
      alamat: item?.alamat || item?.alamat_kk || '',
      pendidikan_terakhir: item?.pendidikan_terakhir || item?.pendidikan || (item ? '' : (parsed.pendidikan_terakhir || '')),
      skill: item?.skill_tags || item?.skill || (item ? '' : (parsed.skill || '')),
      status_kerja: item?.pekerjaan || item?.status_kerja || (item ? '' : (parsed.status_kerja || '')),
      tempat_bekerja: item?.tempat_bekerja || (item ? '' : (parsed.tempat_bekerja || '')),
      no_hp_wa: item?.no_hp_wa || item?.telepon || (item ? '' : (parsed.no_hp_wa || '')),
      email: item?.email || (item ? '' : (parsed.email || '')),
      keterangan: item?.keterangan || (item ? '' : (parsed.keterangan || '')),
      // Hidden/Background fields to maintain logic
      desa: item?.desa || '',
      kecamatan: item?.kecamatan || '',
      tanggal_lahir: item?.tanggal_lahir || null,
      availability: item?.availability !== undefined ? item.availability : (item ? 1 : (parsed.availability ?? 1))
    };
  };

  // --- BUKA FORM EDIT / CREATE ---
  const openEditForm = (item = null) => {
    // Guard permission
    if ((!employmentPerm.edit && !item) || (!employmentPerm.edit && item && isReadOnlyMode)) return; 

    setActiveTab('create');
    setEditItem(getInitialEmploymentForm(item));
    if (item) {
      setSelectedResident({ nik: item.nik, nama: item.nama });
      setResidentSearchTerm(`${item.nama} (${item.nik})`);
    } else {
      setSelectedResident(null);
      setResidentSearchTerm('');
    }
  };

  // --- UPDATE ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    if (!employmentPerm.edit || isReadOnlyMode) {
      alert('Anda tidak memiliki izin untuk mengedit data angkatan kerja.');
      return;
    }

    setSubmitStatus('loading');

    try {
      const payload = {
        ...editItem,
        skill_tags: editItem.skill,
        tanggal_lahir: editItem.tanggal_lahir ? new Date(editItem.tanggal_lahir).toISOString().split('T')[0] : null,
        pekerjaan: getComputedStatus({
          tanggal_lahir: editItem.tanggal_lahir,
          tempat_bekerja: editItem.tempat_bekerja,
          pekerjaan: editItem.status_kerja
        }),
        keterangan: editItem.keterangan || null,
      };

      await adminAPI.updateEmploymentFull(payload);

      // Save defaults to history
      localStorage.setItem('sikamali_last_employment', JSON.stringify({
        pendidikan_terakhir: editItem.pendidikan_terakhir,
        skill: editItem.skill,
        status_kerja: editItem.status_kerja,
        tempat_bekerja: editItem.tempat_bekerja,
        no_hp_wa: editItem.no_hp_wa
      }));

      setSubmitStatus('success');
      setTimeout(() => {
        setEditItem(null);
        setActiveTab('list');
        loadData();
        setSubmitStatus('idle');
      }, 1500);
    } catch (err) {
      setSubmitStatus('idle');
      alert('Gagal Update: ' + err.message);
    }
  };

  // --- DELETE ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!employmentPerm.delete || isReadOnlyMode) {
      alert('Anda tidak memiliki izin untuk menghapus data angkatan kerja.');
      return;
    }

    setSubmitStatus('loading');
    try {
      await adminAPI.deleteEmployment(deleteTarget.id);
      setSubmitStatus('success');
      setTimeout(() => {
        setDeleteTarget(null);
        loadData();
        setSubmitStatus('idle');
      }, 1500);
    } catch (err) {
      setSubmitStatus('idle');
      alert('Gagal Hapus: ' + err.message);
    }
  };

  // --- HELPER STATUS ---
  const getComputedStatus = (item) => {
    const age = item.tanggal_lahir ? calculateAge(item.tanggal_lahir) : 0;
    const workplace = item.tempat_bekerja;
    const rawStatus = item.pekerjaan || item.status_kerja;

    if (workplace && workplace.trim().length > 0 && workplace !== '-') {
      return rawStatus || 'Bekerja';
    }

    if (age >= 18) {
      const s = (rawStatus || '').toLowerCase().trim();
      const nonWorking = ['', '-', 'belum bekerja', 'tidak bekerja', 'menganggur'];

      if (nonWorking.includes(s)) {
        return 'Siap Kerja';
      }
    }

    return rawStatus || '-';
  };

  // --- FILTER ---
  // --- FILTER ---
  const uniqueDesa = [...new Set(dataList.map(item => item.desa).filter(Boolean))].sort();
  const uniqueKecamatan = [...new Set(dataList.map(item => item.kecamatan).filter(Boolean))].sort();
  const uniquePendidikan = [...new Set(dataList.map(item => item.pendidikan_terakhir).filter(Boolean))].sort();

  const ageRanges = {
    'Balita (0-5)': { min: 0, max: 5 },
    'Kanak-kanak (6-11)': { min: 6, max: 11 },
    'Remaja (12-25)': { min: 12, max: 25 },
    'Dewasa (26-45)': { min: 26, max: 45 },
    'Lansia (46+)': { min: 46, max: 150 }
  };

  const filteredList = dataList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const computedStatus = getComputedStatus(item);

    const matchesSearch =
      (item.nama || '').toLowerCase().includes(searchLower) ||
      (item.nik || '').includes(searchLower) ||
      (item.nomor_kk || '').includes(searchLower) ||
      computedStatus.toLowerCase().includes(searchLower) ||
      (item.skill_tags || item.skill || '').toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (!filterCategory || !filterValue) return true;

    if (filterCategory === 'Desa') return item.desa === filterValue;
    if (filterCategory === 'Kecamatan') return item.kecamatan === filterValue;
    if (filterCategory === 'Pendidikan Terakhir') return item.pendidikan_terakhir === filterValue;
    if (filterCategory === 'Rentang Umur') {
      const range = ageRanges[filterValue];
      if (!range) return true;
      const age = item.tanggal_lahir ? calculateAge(item.tanggal_lahir) : 0;
      return age >= range.min && age <= range.max;
    }

    return true;
  });

  return (
    <>
      <SubmitOverlay status={submitStatus} />

      <div className="admin-page">
        <div className="admin-header">
          <div className="header-title-section">
            <h2><Briefcase size={28} /> {activeTab === 'create' ? (editItem?.id ? 'Edit Angkatan Kerja' : 'Input Anggota Baru') : 'Data Angkatan Kerja'}</h2>
            <p className="header-subtitle">
              {activeTab === 'create' ? 'Silakan isi formulir di bawah ini dengan data yang valid.' : 'Daftar lengkap angkatan kerja dan status pekerjaan penduduk lingkar tambang.'}
            </p>
          </div>

          <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeTab === 'list' && (
              <>
                <Tooltip title="Refresh Data">
                  <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1 }}>
                    <RefreshIcon size={20} color="#10b981" />
                  </IconButton>
                </Tooltip>
                {employmentPerm.export && (
                  <>
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
                        <FileDownloadIcon size={18} /> Export Terfilter ({filteredList.length})
                      </MenuItem>
                      <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
                        <Users size={18} /> Export Semua ({dataList.length})
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </>
            )}

            {activeTab === 'list' && !isReadOnlyMode && employmentPerm.edit && (
              <button
                className="btn-add-data"
                onClick={() => openEditForm(null)}
              >
                + Tambah Angkatan Kerja
              </button>
            )}
            
            {activeTab === 'create' && (
               <Button 
                variant="outlined" 
                onClick={() => { setActiveTab('list'); setEditItem(null); }}
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  borderColor: '#9ca3af',
                  color: '#4b5563',
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#f3f4f6' }
                }}
              >
                Kembali ke List
              </Button>
            )}
          </div>
        </div>

        {activeTab === 'list' && (
          <>
        <div className="table-wrapper">
        {/* TOOLBAR */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: '#fcfcfc', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <TextField
              size="small"
              placeholder="Cari Nama, NIK, No KK, Skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: { xs: '100%', md: 300 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'white',
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#00AEEF' },
                }
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
                  setFilterValue('');
                }}
                sx={{ borderRadius: 3, bgcolor: 'white' }}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="Rentang Umur">Rentang Umur</MenuItem>
                <MenuItem value="Pendidikan Terakhir">Pendidikan Terakhir</MenuItem>
                <MenuItem value="Desa">Desa</MenuItem>
                <MenuItem value="Kecamatan">Kecamatan</MenuItem>
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
                  sx={{ borderRadius: 3, bgcolor: 'white' }}
                >
                  <MenuItem value=""><em>All</em></MenuItem>
                  {filterCategory === 'Rentang Umur' && Object.keys(ageRanges).map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                  {filterCategory === 'Pendidikan Terakhir' && uniquePendidikan.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                  {filterCategory === 'Desa' && uniqueDesa.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                  {filterCategory === 'Kecamatan' && uniqueKecamatan.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

        </Box>

            {loading ? (
              <p className="loading-text">Memuat data...</p>
            ) : error ? (
              <p className="error-text">Error: {error}</p>
            ) : (
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                      <tr>
                      <th style={{ minWidth: '40px', fontSize: '0.8rem', fontWeight: '800' }}>NO</th>
                      <th style={{ minWidth: '140px', fontSize: '0.8rem', fontWeight: '800' }}>NO KARTU KELUARGA</th>
                      <th style={{ minWidth: '160px', fontSize: '0.8rem', fontWeight: '800' }}>KEPALA KELUARGA</th>
                      <th style={{ minWidth: '180px', fontSize: '0.8rem', fontWeight: '800' }}>ALAMAT</th>
                      <th style={{ minWidth: '160px', fontSize: '0.8rem', fontWeight: '800' }}>NAMA ANGGOTA</th>
                      <th style={{ minWidth: '140px', fontSize: '0.8rem', fontWeight: '800' }}>NIK</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>PENDIDIKAN</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>SKILL</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>STATUS KERJA</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>TEMPAT BEKERJA</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>NO HP/WA</th>
                      <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>E-MAIL</th>
                      <th style={{ minWidth: '180px', fontSize: '0.8rem', fontWeight: '800' }}>KETERANGAN</th>
                      <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan="14" className="no-data">
                          Data tidak ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredList
                        .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                        .map((item, index) => {
                          const displayStatus = getComputedStatus(item);
                          const nonWorking = ['siap kerja', 'belum bekerja', 'tidak bekerja', 'menganggur', '-', ''];
                          const isWorking = !nonWorking.includes(displayStatus.toLowerCase().trim());

                          return (
                            <tr key={item.id || index}>
                              <td style={{ fontSize: '0.75rem' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.nomor_kk || '-'}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.kepala_keluarga || '-'}</td>
                              <td style={{ fontSize: '0.75rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.alamat || item.alamat_kk}>
                                {item.alamat || item.alamat_kk || '-'}
                              </td>
                              <td>{item.nama}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.nik}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.pendidikan_terakhir || item.pendidikan || '-'}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.skill_tags || item.skill || '-'}</td>
                              <td>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  textTransform: 'uppercase', 
                                  whiteSpace: 'nowrap',
                                  color: isWorking ? '#10b981' : '#000000'
                                }}>
                                  {displayStatus}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.75rem' }}>{item.tempat_bekerja || '-'}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.no_hp_wa || item.telepon || '-'}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.email || '-'}</td>
                              <td style={{ fontSize: '0.75rem' }}>{item.keterangan || '-'}</td>
                              <td>
                                <div className="action-buttons">
                                  {employmentPerm.view && (
                                    <button className="btn-icon view" onClick={() => setSelectedItem(item)} title="View Detail">
                                      <VisibilityIcon fontSize="small" />
                                    </button>
                                  )}
                                  {!isReadOnlyMode && (
                                    <>
                                      {employmentPerm.edit && (
                                        <button className="btn-icon edit" onClick={() => openEditForm(item)} title="Edit Data">
                                          <EditIcon fontSize="small" />
                                        </button>
                                      )}
                                      {employmentPerm.delete && item.id && (
                                        <button className="btn-icon delete" onClick={() => setDeleteTarget(item)} title="Hapus Data">
                                          <DeleteIcon fontSize="small" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}

                {Math.ceil(filteredList.length / itemsPerPage) > 1 && (
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#fcfcfc', borderTop: '1px solid rgba(0,0,0,0.05)', mt: 1 }}>
                    <Pagination
                      count={Math.ceil(filteredList.length / itemsPerPage)}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600,
                          borderRadius: '8px',
                        },
                        '& .Mui-selected': {
                          bgcolor: '#10b981 !important',
                          color: 'white',
                        }
                      }}
                    />
                  </Box>
                )}
          </div>

        </>
      )}

      {/* MODAL VIEW */}
      {selectedItem && (
        <div className="modal-backdrop" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3>Detail Data Angkatan Kerja</h3>
              <button className="btn-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
              <div className="detail-item"><label>NIK</label><div className="detail-value highlight">{selectedItem.nik}</div></div>
              <div className="detail-item"><label>Nama</label><div className="detail-value highlight">{selectedItem.nama}</div></div>
              <div className="detail-item"><label>Jenis Kelamin</label><div className="detail-value">{selectedItem.jenis_kelamin}</div></div>
              <div className="detail-item"><label>Umur</label><div className="detail-value">{selectedItem.tanggal_lahir ? calculateAge(selectedItem.tanggal_lahir) + ' Tahun' : '-'}</div></div>
              <div className="detail-item"><label>No Kartu Keluarga</label><div className="detail-value">{selectedItem.nomor_kk}</div></div>
              <div className="detail-item"><label>Kepala Keluarga</label><div className="detail-value">{selectedItem.kepala_keluarga}</div></div>
              <div className="detail-item" style={{ gridColumn: 'span 2' }}><label>Alamat</label><div className="detail-value">{selectedItem.alamat || selectedItem.alamat_kk || '-'}</div></div>
              <div className="detail-item"><label>Desa/Kelurahan</label><div className="detail-value">{selectedItem.desa}</div></div>
              <div className="detail-item"><label>ZONA</label><div className="detail-value badge-zona">{selectedItem.zona}</div></div>
              <div className="detail-item"><label>Pendidikan Terakhir</label><div className="detail-value">{selectedItem.pendidikan_terakhir || selectedItem.pendidikan || '-'}</div></div>
              <div className="detail-item"><label>Skill</label><div className="detail-value">{selectedItem.skill_tags || selectedItem.skill || '-'}</div></div>
              <div className="detail-item"><label>Status Kerja</label>
                <div className="detail-value" style={{ 
                  color: !['siap kerja', 'belum bekerja', 'tidak bekerja', 'menganggur', '-', ''].includes((selectedItem.pekerjaan || selectedItem.status_kerja || '').toLowerCase().trim()) ? '#10b981' : '#000000',
                  fontWeight: 'bold'
                }}>
                  {selectedItem.pekerjaan || selectedItem.status_kerja || '-'}
                </div>
              </div>
              <div className="detail-item"><label>Tempat Bekerja</label><div className="detail-value">{selectedItem.tempat_bekerja}</div></div>
              <div className="detail-item"><label>Pengalaman Kerja</label><div className="detail-value">{selectedItem.experience_years ? selectedItem.experience_years + ' Tahun' : '-'}</div></div>
              <div className="detail-item"><label>Ketersediaan</label><div className="detail-value">{selectedItem.availability === 1 ? 'Tersedia' : 'Tidak Tersedia'}</div></div>
              <div className="detail-item"><label>Posisi yang Diinginkan</label><div className="detail-value">{selectedItem.preferred_roles || '-'}</div></div>
              <div className="detail-item"><label>Agama</label><div className="detail-value">{selectedItem.agama || '-'}</div></div>
              <div className="detail-item"><label>Status Perkawinan</label><div className="detail-value">{selectedItem.status_perkawinan || '-'}</div></div>
              <div className="detail-item"><label>Nama Ayah</label><div className="detail-value">{selectedItem.nama_ayah || '-'}</div></div>
              <div className="detail-item"><label>Nama Ibu</label><div className="detail-value">{selectedItem.nama_ibu || '-'}</div></div>
              <div className="detail-item"><label>No HP / WA</label><div className="detail-value">{selectedItem.no_hp_wa || selectedItem.telepon || '-'}</div></div>
              <div className="detail-item"><label>E-mail</label><div className="detail-value">{selectedItem.email}</div></div>
              {selectedItem.keterangan && (
                <div className="detail-item" style={{ gridColumn: 'span 2' }}><label>Keterangan</label><div className="detail-value">{selectedItem.keterangan}</div></div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* FORM CREATE / EDIT (INLINE PAGE) */}
      {activeTab === 'create' && editItem && (
        <div className="form-page-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>
             <form onSubmit={handleUpdate}>
                <div className="form-container" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                <h3>Input Data Angkatan Kerja Baru</h3>
                <div className="search-section" style={{ 
                  background: '#f8fafc', 
                  padding: '24px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  marginBottom: '24px'
                }}>
                  <div className="form-group" style={{ marginBottom: '0', position: 'relative' }}>
                    <label style={{ color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px' }}>
                      Cari Penduduk (NIK / Nama) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <input 
                          className="input-modern" 
                          value={residentSearchTerm} 
                          onChange={(e) => handleResidentSearch(e.target.value)} 
                          disabled={!!editItem.id} 
                          placeholder="Ketik NIK atau Nama..."
                          style={{ 
                            paddingLeft: '40px',
                            background: editItem.id ? '#f1f5f9' : 'white',
                            borderColor: selectedResident ? '#10b981' : '#d1d5db'
                          }}
                        />
                        <SearchIcon style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                      </div>
                      {selectedResident && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          background: '#ecfdf5', 
                          padding: '0 16px', 
                          height: '46px',
                          borderRadius: '8px', 
                          color: '#065f46', 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          border: '1px solid #a7f3d0' 
                        }}>
                          <CheckCircleIcon style={{ fontSize: 18, marginRight: 8 }} /> Terpilih
                        </div>
                      )}
                    </div>
                    
                    {residentSuggestions.length > 0 && (
                      <ul className="user-suggestions" style={{ top: '100%', left: 0, right: 0, zIndex: 1000 }}>
                        {residentSuggestions.map(res => (
                          <li key={res.id} className="item" onClick={() => selectResident(res)}>
                            <div className="primary">{res.nama}</div>
                            <div className="secondary">{res.nik} - {res.nomor_kk}</div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!editItem.id && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', marginBottom: 0 }}>Masukkan NIK atau Nama penduduk untuk mengambil data otomatis.</p>}
                  </div>
                </div>

                {/* Read-only KK Info Card */}
                {selectedResident && (
                  <div className="kk-info-card" style={{ 
                    background: '#f0f9ff', 
                    padding: '20px', 
                    borderRadius: '12px', 
                    border: '1px solid #e0f2fe',
                    marginBottom: '24px'
                  }}>
                    <div className="form-row" style={{ marginBottom: '0' }}>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label style={{ color: '#0369a1', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>No Kartu Keluarga</label>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0c4a6e', marginTop: '4px' }}>{editItem.nomor_kk || '-'}</div>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0' }}>
                        <label style={{ color: '#0369a1', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>Kepala Keluarga</label>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0c4a6e', marginTop: '4px' }}>{editItem.kepala_keluarga || '-'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CARD CONTAINER */}
                <div style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '24px', 
                  backgroundColor: '#f8fafc' 
                }}>
                  <h4 style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    paddingBottom: '12px', 
                    marginBottom: '20px', 
                    color: '#1e293b', 
                    marginTop: '0',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}>Data Tenaga Kerja</h4>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nama Lengkap <RequiredMark /></label>
                    <input className="input-modern" value={editItem.nama} onChange={(e) => setEditItem({ ...editItem, nama: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>NIK <RequiredMark /></label>
                    <input className="input-modern" value={editItem.nik} onChange={(e) => setEditItem({ ...editItem, nik: e.target.value })} required disabled={!!editItem.id} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label>Alamat Lengkap</label>
                  <textarea 
                    className="input-modern" 
                    value={editItem.alamat} 
                    onChange={(e) => setEditItem({ ...editItem, alamat: e.target.value })} 
                    placeholder="Alamat domisili saat ini..."
                    rows="2"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pendidikan Terakhir</label>
                    <select className="input-modern" value={editItem.pendidikan_terakhir} onChange={(e) => setEditItem({ ...editItem, pendidikan_terakhir: e.target.value })}>
                      <option value="">Pilih...</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA/SMK">SMA/SMK</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="Tidak Sekolah">Tidak Sekolah</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Skill / Keahlian</label>
                    <input className="input-modern" value={editItem.skill} onChange={(e) => setEditItem({ ...editItem, skill: e.target.value })} placeholder="Contoh: Menjahit, Komputer" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pekerjaan (Status)</label>
                    <input className="input-modern" value={editItem.status_kerja} onChange={(e) => setEditItem({ ...editItem, status_kerja: e.target.value })} placeholder="Contoh: Siap Kerja, Honorer, dll" />
                  </div>
                  <div className="form-group">
                     <label>Tempat Bekerja</label>
                    <input className="input-modern" value={editItem.tempat_bekerja} onChange={(e) => setEditItem({ ...editItem, tempat_bekerja: e.target.value })} placeholder="Nama Perusahaan / Instansi" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>No HP / WA</label>
                    <input className="input-modern" value={editItem.no_hp_wa} onChange={(e) => setEditItem({ ...editItem, no_hp_wa: e.target.value })} placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" className="input-modern" value={editItem.email} onChange={(e) => setEditItem({ ...editItem, email: e.target.value })} placeholder="example@mail.com" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Keterangan / Catatan</label>
                  <textarea className="input-modern" value={editItem.keterangan} onChange={(e) => setEditItem({ ...editItem, keterangan: e.target.value })} placeholder="Catatan tambahan..." rows="3" />
                </div>
                
                
                <div className="form-actions" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => { setActiveTab('list'); setEditItem(null); }} 
                    disabled={submitStatus === 'loading'}
                    sx={{ 
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 3,
                      borderColor: '#9ca3af',
                      color: '#4b5563',
                      '&:hover': { borderColor: '#6b7280', bgcolor: '#f3f4f6' }
                    }}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={submitStatus === 'loading'}
                    sx={{ 
                      bgcolor: '#10b981', 
                      '&:hover': { bgcolor: '#059669' },
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 3,
                      fontWeight: 600
                    }}
                  >
                    {submitStatus === 'loading' ? 'Menyimpan...' : 'Simpan 1 Anggota'}
                  </Button>
                </div>
              </div> {/* End Card */}

              </div>
            </form>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteTarget && (
        <div className="modal-backdrop" onClick={() => submitStatus !== 'loading' && setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Data</h3>
              <button className="btn-close" onClick={() => submitStatus !== 'loading' && setDeleteTarget(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus data <strong>{deleteTarget.nama}</strong>?</p>
              <p className="text-danger">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={submitStatus === 'loading'}>Batal</button>
              <button className="btn-danger" onClick={handleDelete} disabled={submitStatus === 'loading'}>{submitStatus === 'loading' ? 'Menghapus...' : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}