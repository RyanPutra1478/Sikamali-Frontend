import React, { useEffect, useState } from 'react';
import { kkAPI, adminAPI } from '../services/api';
import './AdminPage.css';
import './AdminPrasejahtera.css'; // Import styles from Prasejahtera
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment, Box, Tooltip, IconButton, Pagination, Menu } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIconMui from '@mui/icons-material/FileDownload';
import { getRolePermissions } from '../utils/permissions';
import { Users, RefreshCw as RefreshIcon, Download as FileDownloadIcon } from 'lucide-react';
import MemberFormModal from '../components/MemberFormModal';
import * as XLSX from 'xlsx';

const OCCUPATION_OPTIONS = [
    "APOTEKER",
    "BELUM/ TIDAK BEKERJA",
    "BURUH HARIAN LEPAS",
    "BURUH TANI/ PERKEBUNAN",
    "CERAI MATI BELUM TERCATAT",
    "DOKTER",
    "GURU",
    "GURU PPPK",
    "KARYAWAN HONORER",
    "KARYAWAN SWASTA",
    "KEPOLISIAN RI (POLRI)",
    "LANJUT USIA (LANSIA)",
    "MENGURUS RUMAH TANGGA",
    "NELAYAN/ PERIKANAN",
    "PARAMEDIK/ BIDAN/ PERAWAT",
    "PEDAGANG",
    "PEGAWAI HONORER",
    "PEGAWAI NEGERI SIPIL (PNS)",
    "PEKERJAAN LAINNYA",
    "PELAJAR/ MAHASISWA",
    "PENSIUNAN",
    "PETANI/ PEKEBUN",
    "SOPIR",
    "TENTARA NASIONAL INDONESIA (TNI)",
    "TUKANG JAHIT",
    "WARTAWAN/ JURNALIS",
    "WIRASWASTA"
];

const MARITAL_STATUS_OPTIONS = [
    "BELUM KAWIN",
    "CERAI",
    "CERAI HIDUP",
    "CERAI HIDUP BELUM TERCATAT",
    "CERAI HIDUP TERCATAT",
    "CERAI MATI",
    "CERAI MATI BELUM TERCATAT",
    "CERAI MATI TERCATAT",
    "KAWIN",
    "KAWIN BELUM TERCATAT",
    "KAWIN TERCATAT"
];

const EDUCATION_OPTIONS = [
    "AKADEMI/ DIPLOMA III/ SARJANA MUDA",
    "BELUM TAMAT SD/ SEDERAJAT",
    "DIPLOMA I/II",
    "DIPLOMA IV/ STRATA 1",
    "DOKTORAL/ STRATA 3",
    "GURU HONORER",
    "MAGISTER/ STRATA 2",
    "SLTA/ SEDERAJAT",
    "SLTP/ SEDERAJAT",
    "TAMAT SD/ SEDERAJAT",
    "TIDAK/ BELUM SEKOLAH"
];

const FAMILY_RELATIONSHIP_OPTIONS = [
    "ANAK",
    "CUCU",
    "FAMILI LAIN",
    "ISTRI",
    "KEPALA KELUARGA",
    "LAINNYA",
    "MERTUA",
    "ORANG TUA",
    "SAUDARA"
];

export default function AdminMembers({ user }) {
    // Ambil user dari props ATAU dari localStorage
    let storedUser = null;
    try {
        storedUser = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
        storedUser = null;
    }

    const role = user?.role || storedUser?.role || 'user';
    const perms = getRolePermissions(role);

    const membersPerm = perms?.database?.kk || {
        view: false, insert: false, edit: false, delete: false, copy: false
    };

    const isReadOnlyMode = !membersPerm.edit;
    const [activeTab, setActiveTab] = useState('list'); // Default to 'list'
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    // Create Form State
    const [selectedKK, setSelectedKK] = useState(null);
    const [kkSearch, setKkSearch] = useState('');
    const [kkSearchResults, setKkSearchResults] = useState([]);
    const [allKK, setAllKK] = useState([]); // Store all KKs for real-time search
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);

    // Edit/View Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false);

    const [savedCount, setSavedCount] = useState(0);

    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
    const openExportMenu = Boolean(exportMenuAnchor);

    // --- HANDLERS FOR LIST ACTIONS ---
    const handleViewMember = (member) => {
        setEditingMember(member);
        setIsViewMode(true);
        setEditModalOpen(true);
    };

    const handleEditMember = (member) => {
        setEditingMember(member);
        setIsViewMode(false);
        setEditModalOpen(true);
    };

    const handleUpdateMember = async (data) => {
        try {
            await kkAPI.updateMember(editingMember.id, data);
            alert('Anggota berhasil diupdate');
            setEditModalOpen(false);
            setEditingMember(null);
            loadMembers(); // Refresh list
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteMemberFromList = async (id) => {
        if (!window.confirm('Hapus anggota ini?')) return;
        try {
            await kkAPI.deleteMember(id);
            loadMembers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleExportExcel = (exportFiltered) => {
        const sourceData = exportFiltered ? filteredMembers : members;
        if (sourceData.length === 0) {
            alert("Tidak ada data untuk diexport");
            return;
        }

        const exportData = sourceData.map((m, index) => ({
            'No': index + 1,
            'No KK': m.nomor_kk || '-',
            'Kepala Keluarga': m.kepala_keluarga || '-',
            'Nama Anggota': m.nama,
            'NIK': m.nik,
            'Jenis Kelamin': m.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? 'LAKI-LAKI' : (m.jenis_kelamin?.toString().toUpperCase().startsWith('P') ? 'PEREMPUAN' : '-'),
            'Tempat Lahir': m.tempat_lahir || '-',
            'Tanggal Lahir': m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString('id-ID') : '-',
            'Umur': m.tanggal_lahir ? new Date().getFullYear() - new Date(m.tanggal_lahir).getFullYear() : (m.umur || '-'),
            'Agama': m.agama || '-',
            'Pendidikan': m.pendidikan || '-',
            'Pekerjaan': m.pekerjaan || '-',
            'Gol. Darah': m.golongan_darah || '-',
            'Status Perkawinan': m.status_perkawinan || '-',
            'Hubungan Keluarga': m.hubungan_keluarga || '-',
            'Status Domisili': m.status_domisili || '-',
            'Desa': m.desa || '-',
            'Kecamatan': m.kecamatan || '-',
            'Keterangan': m.keterangan || '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Anggota");
        XLSX.writeFile(wb, `Data_Anggota_${new Date().getTime()}.xlsx`);
        setExportMenuAnchor(null);
    };

    // Initial empty form template with history awareness
    const getInitialFormState = () => {
        const lastData = localStorage.getItem('sikamali_last_member');
        const baseForm = {
            nik: '', nama: '', status_domisili: 'Penduduk Asli',
            hubungan_keluarga: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
            agama: '', status_perkawinan: '', tanggal_perkawinan: '', pendidikan: '', pendidikan_terakhir: '',
            pekerjaan: '', status_kerja: '', tempat_bekerja: '', no_hp: '', email: '',
            golongan_darah: '', kewarganegaraan: 'WNI', no_paspor: '', no_kitap: '', nama_ayah: '', nama_ibu: '',
            status_data: 'AKTIF', keterangan: ''
        };

        if (lastData) {
            try {
                const parsed = JSON.parse(lastData);
                return {
                    ...baseForm,
                    status_domisili: parsed.status_domisili || 'Penduduk Asli',
                    tempat_lahir: parsed.tempat_lahir || '',
                    agama: parsed.agama || '',
                    pendidikan: parsed.pendidikan || '',
                    pekerjaan: parsed.pekerjaan || '',
                    golongan_darah: parsed.golongan_darah || '',
                    kewarganegaraan: parsed.kewarganegaraan || 'WNI',
                    nama_ayah: parsed.nama_ayah || '',
                    nama_ibu: parsed.nama_ibu || '',
                    status_data: parsed.status_data || 'AKTIF'
                };
            } catch (e) {
                return baseForm;
            }
        }
        return baseForm;
    };

    const initialFormState = getInitialFormState();

    // Array of forms for bulk input
    const [memberForms, setMemberForms] = useState([initialFormState]);

    useEffect(() => {
        if (activeTab === 'list' && !editModalOpen) {
            loadMembers();
        } else if (activeTab === 'create' || editModalOpen) {
            loadAllKK(); // Load KKs for search when in create mode or edit modal
        }
    }, [activeTab, editModalOpen]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterCategory, filterValue]);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const [membersData, kkData] = await Promise.all([
                kkAPI.getAllMembers(),
                adminAPI.getKK()
            ]);

            // Merge KK info into members for filtering
            const mergedMembers = membersData.map(member => {
                const kk = kkData.find(k => k.id === member.kk_id || k.nomor_kk === member.nomor_kk) || {};
                return {
                    ...member,
                    nomor_kk: member.kk_nomor || kk.nomor_kk || member.nomor_kk || '-',
                    kepala_keluarga: member.kk_kepala || kk.kepala_keluarga || member.kepala_keluarga || '',
                    desa: kk.desa || member.desa || '',
                    kecamatan: kk.kecamatan || member.kecamatan || ''
                };
            });

            setMembers(mergedMembers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterValue('');
        setPage(1);
        loadMembers();
    };

    const loadAllKK = async () => {
        try {
            const data = await adminAPI.getKK();
            setAllKK(data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- FILTER LOGIC ---
    // --- FILTER LOGIC ---
    const calculateAge = (dob) => {
        if (!dob) return 0;
        const birthDate = new Date(dob);
        const today = new Date();
        if (Number.isNaN(birthDate.getTime())) return 0;
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const uniqueDesa = [...new Set(members.map(item => item.desa).filter(Boolean))].sort();
    const uniqueKecamatan = [...new Set(members.map(item => item.kecamatan).filter(Boolean))].sort();

    const ageRanges = {
        'Balita (0-5)': { min: 0, max: 5 },
        'Kanak-kanak (6-11)': { min: 6, max: 11 },
        'Remaja (12-25)': { min: 12, max: 25 },
        'Dewasa (26-45)': { min: 26, max: 45 },
        'Lansia (46+)': { min: 46, max: 150 }
    };

    const filteredMembers = members.filter(m => {
        const term = searchTerm.toLowerCase();
        const matchSearch = term === '' ||
            (m.nama && m.nama.toLowerCase().includes(term)) ||
            (m.nik && m.nik.includes(term)) ||
            (m.nomor_kk && m.nomor_kk.includes(term)) ||
            (m.kepala_keluarga && m.kepala_keluarga.toLowerCase().includes(term));

        if (!matchSearch) return false;

        if (!filterCategory || !filterValue) return true;

        if (filterCategory === 'Desa') return m.desa === filterValue;
        if (filterCategory === 'Kecamatan') return m.kecamatan === filterValue;
        if (filterCategory === 'Jenis Kelamin') return m.jenis_kelamin === filterValue;
        if (filterCategory === 'Rentang Umur') {
            const range = ageRanges[filterValue];
            if (!range) return true;
            const age = m.tanggal_lahir ? calculateAge(m.tanggal_lahir) : (m.umur || 0);
            return age >= range.min && age <= range.max;
        }

        return true;
    });

    // --- CREATE FORM HANDLERS ---
    const handleKKSearch = (term) => {
        setKkSearch(term);
        if (term.length > 1) {
            const results = allKK.filter(k =>
                k.nomor_kk.includes(term) || k.kepala_keluarga.toLowerCase().includes(term.toLowerCase())
            );
            setKkSearchResults(results);
        } else {
            setKkSearchResults([]);
        }
    };

    const selectKK = (kk) => {
        setSelectedKK(kk);
        setKkSearch(`${kk.kepala_keluarga} (${kk.nomor_kk})`);
        setKkSearchResults([]);
    };

    const addMemberForm = () => {
        setMemberForms([...memberForms, getInitialFormState()]);
    };

    const removeMemberForm = (index) => {
        const newForms = [...memberForms];
        newForms.splice(index, 1);
        setMemberForms(newForms);
    };

    const handleChange = (index, e) => {
        const { name, value } = e.target;
        const newForms = [...memberForms];
        newForms[index] = { ...newForms[index], [name]: value };
        setMemberForms(newForms);
    };

    const handleSubmitAll = async (e) => {
        e.preventDefault();
        if (!selectedKK) {
            alert('Pilih Kartu Keluarga terlebih dahulu!');
            return;
        }

        setLoading(true);
        let successCount = 0;
        try {
            for (const form of memberForms) {
                await kkAPI.addMember({ ...form, kk_id: selectedKK.id });
                successCount++;
                
                // Save defaults from the last row processed (or all if they are likely same)
                localStorage.setItem('sikamali_last_member', JSON.stringify({
                    status_domisili: form.status_domisili,
                    tempat_lahir: form.tempat_lahir,
                    agama: form.agama,
                    pendidikan: form.pendidikan,
                    pekerjaan: form.pekerjaan,
                    golongan_darah: form.golongan_darah,
                    kewarganegaraan: form.kewarganegaraan,
                    nama_ayah: form.nama_ayah,
                    nama_ibu: form.nama_ibu,
                    status_data: form.status_data
                }));
            }
            setSavedCount(successCount);
            setSuccessDialogOpen(true);
            setMemberForms([initialFormState]);
            setSelectedKK(null);
            setKkSearch('');
            setActiveTab('list');
        } catch (err) {
            alert('Gagal menyimpan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        setSuccessDialogOpen(false);
        setActiveTab('list');
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div className="header-title-section">
                    <h2><Users size={28} /> Anggota Keluarga</h2>
                    <p className="header-subtitle">
                        Daftar seluruh penduduk yang terdaftar dalam sistem dan riwayat administrasi kependudukan.
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
                            {membersPerm.export && (
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
                                            <FileDownloadIcon size={18} /> Export Terfilter ({filteredMembers.length})
                                        </MenuItem>
                                        <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
                                            <Users size={18} /> Export Semua ({members.length})
                                        </MenuItem>
                                    </Menu>
                                </>
                            )}
                        </>
                    )}

                    {activeTab === 'list' && membersPerm.insert && (
                        <button className="btn-add-data" onClick={() => setActiveTab('create')}>
                            + Tambah Anggota Keluarga
                        </button>
                    )}
                    {activeTab === 'create' && (
                        <Button 
                          variant="outlined" 
                          onClick={() => setActiveTab('list')}
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

            {activeTab === 'create' && (
                <div className="form-container" style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
                    <h3>Input Anggota Keluarga Baru</h3>
                    <div className="form-group" style={{ position: 'relative', marginBottom: '2rem' }}>
                        <label>Cari Kepala Keluarga / No Kartu Keluarga *</label>
                        <input
                            type="text"
                            className="input-modern"
                            placeholder="Ketik nama atau nomor KK..."
                            value={kkSearch}
                            onChange={e => handleKKSearch(e.target.value)}
                        />
                        {kkSearchResults.length > 0 && (
                            <ul className="user-suggestions">
                                {kkSearchResults.map(kk => (
                                    <li key={kk.id} className="item" onClick={() => selectKK(kk)}>
                                        <div className="primary">{kk.kepala_keluarga}</div>
                                        <div className="secondary">{kk.nomor_kk} - {kk.desa}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {selectedKK && (
                        <div className="user-info-box">
                            <p><strong>Kepala Keluarga:</strong> {selectedKK.kepala_keluarga}</p>
                            <p><strong>No Kartu Keluarga:</strong> {selectedKK.nomor_kk}</p>
                            <p><strong>Alamat:</strong> {selectedKK.alamat}, {selectedKK.desa}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmitAll}>
                        {memberForms.map((form, index) => (
                            <div key={index} className="member-form-card" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <h4>Anggota #{index + 1}</h4>
                                    {memberForms.length > 1 && (
                                        <button type="button" className="btn-danger" onClick={() => removeMemberForm(index)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                                            Hapus
                                        </button>
                                    )}
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>NIK *</label>
                                        <input name="nik" value={form.nik} onChange={(e) => handleChange(index, e)} required maxLength="16" className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Lengkap *</label>
                                        <input name="nama" value={form.nama} onChange={(e) => handleChange(index, e)} required className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Status Domisili</label>
                                        <select name="status_domisili" value={form.status_domisili} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="Penduduk Asli">Penduduk Asli</option>
                                            <option value="Pendatang">Pendatang</option>
                                            <option value="Meninggal">Meninggal</option>
                                            <option value="Pindah">Pindah</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Hubungan Keluarga</label>
                                        <select 
                                            name="hubungan_keluarga" 
                                            value={form.hubungan_keluarga} 
                                            onChange={(e) => handleChange(index, e)} 
                                            className="input-field"
                                        >
                                            <option value="">Pilih Hubungan</option>
                                            {FAMILY_RELATIONSHIP_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Jenis Kelamin</label>
                                        <select name="jenis_kelamin" value={form.jenis_kelamin} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="">Pilih</option>
                                            <option value="Laki-laki">Laki-laki</option>
                                            <option value="Perempuan">Perempuan</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tempat Lahir</label>
                                        <input name="tempat_lahir" value={form.tempat_lahir} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Tanggal Lahir</label>
                                        <input type="date" name="tanggal_lahir" value={form.tanggal_lahir} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Agama</label>
                                        <select name="agama" value={form.agama} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="">Pilih</option>
                                            <option value="Islam">Islam</option>
                                            <option value="Kristen">Kristen</option>
                                            <option value="Katolik">Katolik</option>
                                            <option value="Hindu">Hindu</option>
                                            <option value="Buddha">Buddha</option>
                                            <option value="Konghucu">Konghucu</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Pendidikan</label>
                                        <select 
                                            name="pendidikan" 
                                            value={form.pendidikan} 
                                            onChange={(e) => handleChange(index, e)} 
                                            className="input-field"
                                        >
                                            <option value="">Pilih Pendidikan</option>
                                            {EDUCATION_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Pekerjaan</label>
                                        <select 
                                            name="pekerjaan" 
                                            value={form.pekerjaan} 
                                            onChange={(e) => handleChange(index, e)} 
                                            className="input-field"
                                        >
                                            <option value="">Pilih Pekerjaan</option>
                                            {OCCUPATION_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Golongan Darah</label>
                                        <select name="golongan_darah" value={form.golongan_darah} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="">Pilih</option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="AB">AB</option>
                                            <option value="O">O</option>
                                            <option value="-">-</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Status Perkawinan</label>
                                        <select 
                                            name="status_perkawinan" 
                                            value={form.status_perkawinan} 
                                            onChange={(e) => handleChange(index, e)} 
                                            className="input-field"
                                        >
                                            <option value="">Pilih Status</option>
                                            {MARITAL_STATUS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Tanggal Perkawinan</label>
                                        <input type="date" name="tanggal_perkawinan" value={form.tanggal_perkawinan} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Kewarganegaraan</label>
                                        <select name="kewarganegaraan" value={form.kewarganegaraan} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="WNI">WNI</option>
                                            <option value="WNA">WNA</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>No. Paspor</label>
                                        <input name="no_paspor" value={form.no_paspor} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>No. KITAP</label>
                                        <input name="no_kitap" value={form.no_kitap} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Ayah</label>
                                        <input name="nama_ayah" value={form.nama_ayah} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Nama Ibu</label>
                                        <input name="nama_ibu" value={form.nama_ibu} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>No. HP / WA</label>
                                        <input name="no_hp" value={form.no_hp} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Email (Opsional)</label>
                                        <input type="email" name="email" value={form.email} onChange={(e) => handleChange(index, e)} className="input-field" />
                                    </div>
                                    <div className="form-group">
                                        <label>Status Kependudukan</label>
                                        <select name="status_data" value={form.status_data} onChange={(e) => handleChange(index, e)} className="input-field">
                                            <option value="AKTIF">AKTIF</option>
                                            <option value="PINDAH">PINDAH</option>
                                            <option value="TIDAK AKTIF">TIDAK AKTIF</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Keterangan</label>
                                        <textarea name="keterangan" value={form.keterangan} onChange={(e) => handleChange(index, e)} className="input-field" rows="2" style={{ resize: 'vertical' }} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddCircleIcon />}
                                onClick={addMemberForm}
                                sx={{ textTransform: 'none', marginRight: '10px' }}
                            >
                                Tambah Anggota Lain
                            </Button>
                             <button 
                                 type="button" 
                                 className="btn-secondary" 
                                 onClick={() => {
                                     setActiveTab('list');
                                     setSelectedKK(null);
                                     setKkSearch('');
                                     setMemberForms([getInitialFormState()]);
                                 }}
                                 style={{ marginRight: '10px' }}
                             >
                                 Batal
                             </button>
                             <button type="submit" className="btn-save" disabled={loading}>
                                 {loading ? 'Menyimpan...' : `Simpan ${memberForms.length} Anggota`}
                             </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'list' && (
                <>
                    {/* TOOLBAR */}
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: '#fcfcfc', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                            <TextField
                                size="small"
                                placeholder="Cari Nama / NIK / No Kartu Keluarga..."
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
                                    <MenuItem value="Desa">Desa</MenuItem>
                                    <MenuItem value="Kecamatan">Kecamatan</MenuItem>
                                    <MenuItem value="Jenis Kelamin">Jenis Kelamin</MenuItem>
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
                                        {filterCategory === 'Desa' && uniqueDesa.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                        {filterCategory === 'Kecamatan' && uniqueKecamatan.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                        {filterCategory === 'Jenis Kelamin' && ['Laki-laki', 'Perempuan'].map(opt => (
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

                    <div className="table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '40px', fontSize: '0.8rem', fontWeight: '800' }}>NO</th>
                                    <th style={{ minWidth: '150px', fontSize: '0.8rem', fontWeight: '800' }}>NO KARTU KELUARGA</th>
                                    <th style={{ minWidth: '180px', fontSize: '0.8rem', fontWeight: '800' }}>KEPALA KELUARGA</th>
                                    <th style={{ minWidth: '180px', fontSize: '0.8rem', fontWeight: '800' }}>ANGGOTA KELUARGA</th>
                                    <th style={{ minWidth: '150px', fontSize: '0.8rem', fontWeight: '800' }}>NIK</th>
                                    <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>JENIS KELAMIN</th>
                                    <th style={{ minWidth: '120px', fontSize: '0.8rem', fontWeight: '800' }}>TEMPAT LAHIR</th>
                                    <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>TANGGAL LAHIR</th>
                                    <th style={{ minWidth: '70px', fontSize: '0.8rem', fontWeight: '800' }}>UMUR</th>
                                    <th style={{ minWidth: '90px', fontSize: '0.8rem', fontWeight: '800' }}>AGAMA</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>PENDIDIKAN</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>PEKERJAAN</th>
                                    <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>GOLONGAN DARAH</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>STATUS PERKAWINAN</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>TANGGAL PERKAWINAN</th>
                                    <th style={{ minWidth: '160px', fontSize: '0.8rem', fontWeight: '800' }}>HUBUNGAN DALAM KELUARGA</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>STATUS DOMISILI</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>KEWARGANEGARAAN</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>NO PASPORT</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>NO KITAP</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>NAMA AYAH</th>
                                    <th style={{ minWidth: '130px', fontSize: '0.8rem', fontWeight: '800' }}>NAMA IBU</th>
                                    <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>Status Kependudukan</th>
                                    <th style={{ minWidth: '180px', fontSize: '0.8rem', fontWeight: '800' }}>KETERANGAN</th>
                                    <th style={{ minWidth: '100px', fontSize: '0.8rem', fontWeight: '800' }}>AKSI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="26" style={{ textAlign: 'center', padding: '20px' }}>Memuat data...</td></tr>
                                ) : filteredMembers.length > 0 ? (
                                    filteredMembers
                                        .slice((page - 1) * itemsPerPage, (page - 1) * itemsPerPage + itemsPerPage)
                                        .map((m, index) => (
                                        <tr key={m.id}>
                                            <td style={{ fontSize: '0.75rem' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                                            <td>{m.nomor_kk || '-'}</td>
                                            <td>{m.kepala_keluarga || '-'}</td>
                                            <td>{m.nama}</td>
                                            <td>{m.nik}</td>
                                             <td>
                                                 <span>
                                                     {m.jenis_kelamin?.toString().toUpperCase().startsWith('L') ? 'LAKI-LAKI' : (m.jenis_kelamin?.toString().toUpperCase().startsWith('P') ? 'PEREMPUAN' : '-')}
                                                 </span>
                                             </td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.tempat_lahir || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.tanggal_lahir ? new Date(m.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.tanggal_lahir ? new Date().getFullYear() - new Date(m.tanggal_lahir).getFullYear() : (m.umur || '-')}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.agama || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }} className="nowrap-cell">{m.pendidikan || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }} className="nowrap-cell">{m.pekerjaan || '-'}</td>
                                            <td style={{ fontSize: '0.75rem', textAlign: 'center' }}>{m.golongan_darah || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.status_perkawinan || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.tanggal_perkawinan ? new Date(m.tanggal_perkawinan).toLocaleDateString('id-ID') : '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.hubungan_keluarga || '-'}</td>
                                            <td>
                                                <span style={{
                                                   color: (() => {
                                                       const s = (m.status_domisili || '').toUpperCase().trim();
                                                       if (s.includes('PENDUDUK TETAP')) return '#10b981';
                                                       if (s.includes('WARGA PENDATANG')) return '#3b82f6';
                                                       return 'inherit';
                                                   })()
                                                }}>
                                                    {m.status_domisili || '-'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.kewarganegaraan || 'WNI'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.no_paspor || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.no_kitap || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.nama_ayah || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.nama_ibu || '-'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.status_kependudukan || 'AKTIF'}</td>
                                            <td style={{ fontSize: '0.75rem' }}>{m.keterangan || '-'}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="btn-icon view" onClick={() => handleViewMember(m)} title="Lihat Detail">
                                                        <VisibilityIcon fontSize="small" />
                                                    </button>
                                                    <button className="btn-icon edit" onClick={() => handleEditMember(m)} title="Edit Anggota">
                                                        <EditIcon fontSize="small" />
                                                    </button>
                                                    {membersPerm.delete && (
                                                        <button className="btn-icon delete" onClick={() => handleDeleteMemberFromList(m.id)} title="Hapus Anggota">
                                                            <DeleteIcon fontSize="small" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="26" className="no-data">Tidak ada data ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {Math.ceil(filteredMembers.length / itemsPerPage) > 1 && (
                        <Box
                            sx={{
                                p: 3,
                                display: 'flex',
                                justifyContent: 'center',
                                bgcolor: '#fcfcfc',
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                mt: 1,
                                borderBottomLeftRadius: '16px',
                                borderBottomRightRadius: '16px',
                            }}
                        >
                            <Pagination
                                count={Math.ceil(filteredMembers.length / itemsPerPage)}
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
                </>
            )}

            {/* SUCCESS DIALOG */}
            <Dialog open={successDialogOpen} onClose={handleFinish}>
                <DialogTitle sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon /> Berhasil
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <Typography>
                        Berhasil menyimpan {savedCount} anggota keluarga!
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFinish} variant="contained" color="success">
                        Selesai
                    </Button>
                </DialogActions>
            </Dialog>

            {/* EDIT MODAL */}
            {editModalOpen && (
                <MemberFormModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSubmit={handleUpdateMember}
                    initialData={editingMember}
                    isEdit={!isViewMode}
                    viewMode={isViewMode}
                    allKK={allKK}
                />
            )}
        </div>
    );
}
