import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw as RefreshIcon, Download as FileDownloadIcon, Users } from 'lucide-react';
import './AdminPage.css';
import './AdminPrasejahtera.css';
import { Button, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Box, Tooltip, IconButton, Menu } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIconMui from '@mui/icons-material/FileDownload';
import Pagination from '@mui/material/Pagination';
import * as XLSX from 'xlsx';
import { adminAPI, kkAPI } from '../services/api';

export default function AdminPrasejahtera({ readOnly = false, canCreate = false, canDelete = false, canExport = false }) {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Modal & Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    user_id: '', // account id (optional)
    kk_id: '',
    member_id: '', // Required for backend
    income_per_month: '',
    house_condition: '',
    access_listrik_air: 'false', // string 'true' / 'false'
    status_kesejahteraan: 'sejahtera', // 'prasejahtera' / 'sejahtera' / 'sejahtera mandiri'
    tingkat_sosial: '',
    assessment_notes: '',
  });

  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 🔍 state pencarian kepala keluarga
  const [userSearch, setUserSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  useEffect(() => {
    loadData();
    if (!readOnly) {
      loadUsers();
    }
  }, [readOnly]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterValue]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kesejahteraanData, kkData] = await Promise.all([
        adminAPI.getKesejahteraan(),
        adminAPI.getKK()
      ]);

      const pData = Array.isArray(kesejahteraanData) ? kesejahteraanData : [];
      const kData = Array.isArray(kkData) ? kkData : [];

      // Merge KK info (Desa, Kecamatan)
      const mergedData = pData.map(item => {
        const kk = kData.find(k => k.id === item.kk_id || k.nomor_kk === item.nomor_kk) || {};
        return {
          ...item,
          desa: kk.desa || '',
          kecamatan: kk.kecamatan || ''
        };
      });

      setData(mergedData);
    } catch (err) {
      setError(err.message || 'Gagal memuat data');
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
    const sourceData = exportFiltered ? filteredData : data;
    if (sourceData.length === 0) {
      alert("Tidak ada data untuk diexport");
      return;
    }

    const exportData = sourceData.map((item, index) => ({
      'No': index + 1,
      'No KK': item.nomor_kk || '-',
      'Kepala Keluarga': item.kepala_keluarga || '-',
      'Nama Anggota': item.nama_warga || '-',
      'NIK': item.nik_warga || '-',
      'Kesejahteraan': item.status_kesejahteraan || '-',
      'Pendapatan/Bulan': item.income_per_month || '-',
      'Kondisi Rumah': item.house_condition || '-',
      'Akses Air/Listrik': item.access_listrik_air === 'true' ? 'Ada' : 'Tidak Ada',
      'Desa': item.desa || '-',
      'Kecamatan': item.kecamatan || '-',
      'Catatan': item.assessment_notes || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Prasejahtera");
    XLSX.writeFile(wb, `Data_Prasejahtera_${new Date().getTime()}.xlsx`);
    setExportMenuAnchor(null);
  };

  const loadUsers = async () => {
    try {
      // Ambil semua anggota keluarga dari semua KK agar bisa menilai siapa saja
      const result = await kkAPI.getAllMembers();
      setUsers(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const handleUserSelect = (memberId) => {
    const member = users.find((m) => m.id == memberId) || null;
    setSelectedUser(member);
    setFormData((prev) => ({
      ...prev,
      member_id: memberId,
      kk_id: member?.kk_id || '',
    }));

    if (member) {
      setUserSearch(`${member.nama} (KK: ${member.nomor_kk || '-'})`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.member_id) {
      alert('Silakan pilih Penerima / Anggota Keluarga terlebih dahulu.');
      setSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      income_per_month: parseFloat(formData.income_per_month) || 0,
      access_listrik_air:
        formData.access_listrik_air === true ||
        formData.access_listrik_air === 'true',
      status_kesejahteraan: formData.status_kesejahteraan,
    };



    try {
      // Backend createPrasejahtera sudah bersifat upsert (insert/update by user_id)
      await adminAPI.upsertKesejahteraan(payload);

      // Save defaults to history
      localStorage.setItem('sikamali_last_welfare', JSON.stringify({
        income_per_month: formData.income_per_month,
        house_condition: formData.house_condition,
        access_listrik_air: formData.access_listrik_air,
        status_kesejahteraan: formData.status_kesejahteraan,
        tingkat_sosial: formData.tingkat_sosial,
        assessment_notes: formData.assessment_notes,
      }));

      alert(
        editingRecord
          ? 'Data penilaian berhasil diperbarui.'
          : 'Data penilaian berhasil disimpan.'
      );
      handleCloseModal();
      loadData();
    } catch (err) {
      alert('Error: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  const getInitialWelfareForm = () => {
    const lastData = localStorage.getItem('sikamali_last_welfare');
    const parsed = lastData ? JSON.parse(lastData) : {};
    
    return {
      user_id: '',
      kk_id: '',
      income_per_month: parsed.income_per_month || '',
      house_condition: parsed.house_condition || '',
      access_listrik_air: parsed.access_listrik_air || 'false',
      status_kesejahteraan: parsed.status_kesejahteraan || 'sejahtera',
      tingkat_sosial: parsed.tingkat_sosial || '',
      assessment_notes: parsed.assessment_notes || '',
    };
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setSelectedUser(null);
    setUserSearch('');
    setShowSuggestions(false);
    setFormData(getInitialWelfareForm());
    setEditingRecord(null);
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num || 0);

  // Filter Logic
  const uniqueDesa = [...new Set(data.map(item => item.desa).filter(Boolean))].sort();
  const uniqueKecamatan = [...new Set(data.map(item => item.kecamatan).filter(Boolean))].sort();

  const isWargaPrasejahtera = (item) => {
    return item.status_kesejahteraan === 'prasejahtera' || item.is_prasejahtera === true || item.is_prasejahtera === 1;
  };

  const filteredData = data.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.kepala_keluarga || '').toLowerCase().includes(term) ||
      (item.nomor_kk || '').includes(term) ||
      (item.user_nama || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (!filterCategory || !filterValue) return true;

    if (filterCategory === 'Desa') return item.desa === filterValue;
    if (filterCategory === 'Kecamatan') return item.kecamatan === filterValue;
    if (filterCategory === 'Status') {
      const isPra = isWargaPrasejahtera(item);
      const status = (item.status_kesejahteraan || '').toLowerCase();
      
      if (filterValue === 'Prasejahtera') return isPra;
      if (filterValue === 'Sejahtera') return status === 'sejahtera';
      if (filterValue === 'Sejahtera Mandiri') return status === 'sejahtera mandiri';
    }

    return true;
  });

  // 🔎 filter users berdasarkan pencarian (nama KK / nama user / no KK / KK ID)
  const filteredUsers = users.filter((u) => {
    const term = (userSearch || '').toString().toLowerCase().trim();
    if (!term) return true;

    const nameMember = (u.nama || '').toString().toLowerCase();
    const nameKK = (u.kepala_keluarga || '').toString().toLowerCase();
    const kkNumber = (u.nomor_kk || '').toString().toLowerCase();
    const nikNumber = (u.nik || '').toString().toLowerCase();

    return (
      nameMember.includes(term) ||
      nameKK.includes(term) ||
      kkNumber.includes(term) ||
      nikNumber.includes(term)
    );
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-title-section">
          <h2><FileText size={28} /> Data Warga Prasejahtera</h2>
          <p className="header-subtitle">
            Pemantauan kondisi ekonomi, status sosial, dan klasifikasi kesejahteraan penduduk.
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {showForm ? (
            <Button 
              variant="outlined" 
              onClick={handleCloseModal}
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
          ) : (
            <>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1 }}>
                  <RefreshIcon size={20} color="#10b981" />
                </IconButton>
              </Tooltip>
              {canExport && (
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
                      <FileDownloadIcon size={18} /> Export Terfilter ({filteredData.length})
                    </MenuItem>
                    <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
                      <Users size={18} /> Export Semua ({data.length})
                    </MenuItem>
                  </Menu>
                </>
              )}

              {!readOnly && canCreate && (
                <button
                  className="btn-add-data"
                  onClick={() => {
                    setEditingRecord(null);
                    setFormData({
                      user_id: '',
                      kk_id: '',
                      member_id: '',
                      income_per_month: '',
                      house_condition: '',
                      access_listrik_air: 'false',
                      status_kesejahteraan: 'sejahtera',
                      tingkat_sosial: '',
                      assessment_notes: '',
                    });
                    setUserSearch('');
                    setShowForm(true);
                  }}
                >
                  + Tambah Data Kesejahteraan
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Memuat data...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        /* CONDITIONAL RENDER: FORM OR TABLE */
        showForm ? (
          <div className="form-page-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="form-container" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                {editingRecord ? 'Edit Penilaian Sosial' : 'Input Penilaian Sosial Baru'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                {/* SELECT USER + SEARCH (AUTOCOMPLETE) */}
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>
                    Pilih Anggota Keluarga (NIK / Nama) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Cari nama KK / nama warga / No Kartu Keluarga..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      style={{ paddingLeft: '12px' }}
                    />
                    <SearchIcon style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '4px' }}>Masukkan NIK penduduk yang ingin ditambahkan data penilaian kesejahteraannya.</p>

                  {showSuggestions && userSearch.trim() && (
                    <ul className="user-suggestions" style={{ position: 'absolute', width: '100%', zIndex: 50 }}>
                      {filteredUsers.length === 0 ? (
                        <li className="empty">Tidak ada hasil.</li>
                      ) : (
                        filteredUsers.map((user) => (
                          <li
                            key={user.id}
                            className="item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowSuggestions(false);
                              handleUserSelect(user.id);
                            }}
                          >
                            <div className="primary">{user.nama}</div>
                            <div className="secondary">
                              Kepala Keluarga: {user.kepala_keluarga || '-'} • KK: {user.nomor_kk || '-'} • NIK: {user.nik || '-'}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>

                {/* Read-only KK Info */}
                <div className="form-row" style={{ marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>No Kartu Keluarga</label>
                    <input className="input-modern" value={selectedUser?.nomor_kk || '-'} disabled style={{ backgroundColor: '#f1f5f9' }} />
                  </div>
                  <div className="form-group">
                    <label>Kepala Keluarga</label>
                    <input className="input-modern" value={selectedUser?.kepala_keluarga || '-'} disabled style={{ backgroundColor: '#f1f5f9' }} />
                  </div>
                </div>

                {/* CARD CONTAINER FOR FORM FIELDS */}
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
                  }}>Data Penilaian</h4>

                  {selectedUser && (
                    <div className="user-info-box" style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e0f2fe' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>NAMA PENERIMA</span><strong>{selectedUser.nama}</strong></div>
                        <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>NIK PENERIMA</span><strong>{selectedUser.nik || '-'}</strong></div>
                        <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>KEPALA KELUARGA</span><strong>{selectedUser.kepala_keluarga || '-'}</strong></div>
                        <div><span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>NOMOR KK</span><strong>{selectedUser.nomor_kk || '-'}</strong></div>
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Pendapatan / Bulan (Rp) *</label>
                      <input
                        className="input-modern"
                        type="number"
                        value={formData.income_per_month}
                        onChange={(e) => setFormData({ ...formData, income_per_month: e.target.value })}
                        required
                        placeholder="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Kondisi Hunian / Rumah</label>
                      <select
                        className="input-modern"
                        value={formData.house_condition}
                        onChange={(e) => setFormData({ ...formData, house_condition: e.target.value })}
                      >
                        <option value="">Pilih...</option>
                        <option value="Layak Huni">Layak Huni</option>
                        <option value="Tidak Layak Huni">Tidak Layak Huni</option>
                        <option value="Menumpang">Menumpang</option>
                        <option value="Sewa">Sewa</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Akses Fasilitas (Air & Listrik)</label>
                      <select
                        className="input-modern"
                        value={formData.access_listrik_air}
                        onChange={(e) => setFormData({ ...formData, access_listrik_air: e.target.value })}
                      >
                        <option value="true">Memadai</option>
                        <option value="false">Tidak / Kurang Memadai</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status Kesejahteraan</label>
                      <select
                        className={`input-modern ${formData.status_kesejahteraan === 'prasejahtera' ? 'border-red' : 'border-green'}`}
                        value={formData.status_kesejahteraan}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setFormData({
                            ...formData,
                            status_kesejahteraan: newStatus,
                            tingkat_sosial: newStatus === 'prasejahtera' ? formData.tingkat_sosial : ''
                          });
                        }}
                      >
                        <option value="sejahtera">SEJAHTERA</option>
                        <option value="prasejahtera">PRASEJAHTERA</option>
                        <option value="sejahtera mandiri">SEJAHTERA MANDIRI</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tingkat Sosial / Prioritas</label>
                      <select
                        className="input-modern"
                        value={formData.tingkat_sosial}
                        onChange={(e) => setFormData({ ...formData, tingkat_sosial: e.target.value })}
                        disabled={formData.status_kesejahteraan !== 'prasejahtera'}
                      >
                        <option value="">Pilih Tingkat...</option>
                        <option value="Rentan Ekstrem">RENTAN EKSTREM</option>
                        <option value="Rentan Prioritas">RENTAN PRIORITAS</option>
                        <option value="Rentan Transisi">RENTAN TRANSISI</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Catatan Penilaian / Keterangan</label>
                    <textarea
                      className="input-modern"
                      rows="3"
                      value={formData.assessment_notes}
                      onChange={(e) => setFormData({ ...formData, assessment_notes: e.target.value })}
                      placeholder="Tambahkan detail hasil survey atau catatan lainnya..."
                    />
                  </div>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseModal}
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
                    disabled={submitting}
                    sx={{ 
                      bgcolor: '#10b981', 
                      '&:hover': { bgcolor: '#059669' },
                      textTransform: 'none',
                      borderRadius: '8px',
                      px: 3,
                      fontWeight: 600
                    }}
                  >
                    {submitting ? 'Menyimpan...' : (editingRecord ? 'Update Data' : 'Simpan Data Penilaian')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
        /* TABLE SECTION */
        <div className="table-wrapper">
          {/* TOOLBAR */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: '#fcfcfc', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <TextField
                size="small"
                placeholder="Cari Kepala Keluarga / No Kartu Keluarga..."
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
                  <MenuItem value="Status">Tingkat Kesejahteraan</MenuItem>
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
                    {filterCategory === 'Status' && ['Prasejahtera', 'Sejahtera', 'Sejahtera Mandiri'].map(opt => (
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

            <Tooltip title="Filter List">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th width="4%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>NO</th>
                <th width="14%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>NO KARTU KELUARGA</th>
                <th width="14%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>KEPALA KELUARGA</th>
                <th width="14%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>NAMA TERDAFTAR</th>
                <th width="14%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>NIK</th>
                <th width="10%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>PENDAPATAN PERBULAN</th>
                <th width="10%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>FASILITAS HUNIAN</th>
                <th width="10%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>KATEGORI SOSIAL</th>
                <th width="10%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>TINGKAT SOSIAL</th>
                <th width="10%" style={{ fontSize: '0.8rem', fontWeight: '800' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData
                  .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                  .map((row, index) => (
                      <tr
                        key={row.id}
                        className={
                          isWargaPrasejahtera(row)
                            ? 'row-prasejahtera'
                            : 'row-sejahtera'
                        }
                      >
                      <td style={{ fontSize: '0.75rem' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                    <td style={{ fontSize: '0.75rem' }}>{row.nomor_kk}</td>
                    <td>
                      <div>
                        <span style={{ fontSize: '0.75rem' }}>
                          {row.kepala_keluarga || '-'}
                        </span>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '2px',
                          }}
                        >
                          {row.user_alamat || row.alamat_kk}
                        </div>
                      </div>
                    </td>
                    <td>
                      {row.nama_penerima ? (
                        <div>
                          <span style={{ fontSize: '0.75rem' }}>
                            {row.nama_penerima}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="nowrap-cell" style={{ fontSize: '0.75rem' }}>
                      {row.nik_penerima || row.user_nik || '-'}
                    </td>
                    <td
                      style={{
                        color: '#4b5563',
                        fontSize: '0.75rem',
                      }}
                    >
                      {formatRupiah(row.income_per_month)}
                    </td>
                    <td className="nowrap-cell">
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                        {row.house_condition && (
                          <span
                            className={`condition-tag ${row.house_condition === 'Tidak Layak Huni'
                              ? 'cond-bad'
                              : 'cond-ok'
                              }`}
                            style={{ width: 'fit-content', fontSize: '0.75rem' }}
                          >
                            {row.house_condition}
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {row.access_listrik_air ? (
                            <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  ✅ Memadai
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              ❌ Kurang
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const status = row.status_kesejahteraan || (row.is_prasejahtera ? 'PRASEJAHTERA' : 'SEJAHTERA');
                        const s = status.toLowerCase();
                        let textColor = '#475569';
                        if (s.includes('prasejahtera')) textColor = '#dc2626';
                        else if (s === 'sejahtera mandiri') textColor = '#2563eb';
                        else if (s.includes('sejahtera')) textColor = '#16a34a';
                        
                        return (
                          <span
                            style={{
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              fontSize: '0.75rem',
                              color: textColor,
                              display: 'inline-block'
                            }}
                          >
                            {status}
                          </span>
                        );
                       })()}
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {(() => {
                        const tingkat = row.tingkat_sosial || '';
                        if (!tingkat) return '-';
                        const t = tingkat.toLowerCase();
                        let textColor = '#475569';
                        if (t.includes('ekstrem')) textColor = '#dc2626';
                        else if (t.includes('prioritas')) textColor = '#16a34a';
                        else if (t.includes('transisi')) textColor = '#2563eb';
                        
                        return (
                          <span
                            style={{
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                              color: textColor,
                              display: 'inline-block'
                            }}
                          >
                            {tingkat}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {!readOnly && (
                          <>
                            <button
                              className="btn-icon edit"
                              onClick={() => {
                                setShowForm(true);
                                setEditingRecord(row);
                                setFormData({
                                  user_id: row.user_id,
                                  kk_id: row.kk_id,
                                  member_id: row.member_id || '',
                                  income_per_month: row.income_per_month || '',
                                  house_condition: row.house_condition || '',
                                  access_listrik_air: row.access_listrik_air ? 'true' : 'false',
                                  status_kesejahteraan: row.status_kesejahteraan || (row.is_prasejahtera ? 'prasejahtera' : 'sejahtera'),
                                  tingkat_sosial: row.tingkat_sosial || '',
                                  assessment_notes: row.assessment_notes || '',
                                });

                                const foundMember = users.find((m) => m.id == row.member_id);
                                if (foundMember) {
                                  setSelectedUser(foundMember);
                                  setUserSearch(`${foundMember.nama} (KK: ${foundMember.nomor_kk || '-'})`);
                                }
                              }}
                              title="Edit Penilaian"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            {canDelete && (
                              <button
                                className="btn-icon delete"
                                onClick={() => setDeleteTarget(row)}
                                title="Hapus Penilaian"
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
              )}
            </tbody>
          </table>
        </div>

        {Math.ceil(filteredData.length / itemsPerPage) > 1 && (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', bgcolor: '#fcfcfc', borderTop: '1px solid rgba(0,0,0,0.05)', mt: 1 }}>
            <Pagination
              count={Math.ceil(filteredData.length / itemsPerPage)}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
              size="large"
              sx={{ '& .MuiPaginationItem-root': { fontWeight: 600, borderRadius: '8px' }, '& .Mui-selected': { bgcolor: '#10b981 !important', color: 'white' } }}
            />
          </Box>
        )}
        </div>
        )
      )}

      {/* --- MODAL DELETE & DETAIL (HIDDEN FOR NOW AS NOT REQUESTED) --- */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Hapus Data</h3>
            </div>
            <div className="modal-body-delete">
              <p>Apakah Anda yakin ingin menghapus data penilaian untuk <strong>{deleteTarget.nama_penerima || deleteTarget.user_nama}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-danger" onClick={async () => {
                try {
                  await adminAPI.deleteKesejahteraan(deleteTarget.id);
                  loadData();
                  setDeleteTarget(null);
                } catch (err) {
                  alert('Gagal menghapus: ' + err.message);
                }
              }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

