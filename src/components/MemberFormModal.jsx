import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const formatDateInput = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';

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

const MemberFormModal = ({ isOpen, onClose, onSubmit, initialData, kkId, isEdit, viewMode, allKK, members = [] }) => {
    const [form, setForm] = useState({
        kk_id: '',
        nik: '', nama: '', status_domisili: 'Penduduk Asli',
        hubungan_keluarga: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
        agama: '', status_perkawinan: '', tanggal_perkawinan: '', pendidikan: '', pendidikan_terakhir: '',
        pekerjaan: '', status_kerja: '', tempat_bekerja: '', no_hp: '', email: '',
        golongan_darah: '', kewarganegaraan: 'WNI', no_paspor: '', no_kitap: '', nama_ayah: '', nama_ibu: '',
        status_kependudukan: 'AKTIF', keterangan: ''
    });

    const [kkSearch, setKkSearch] = useState('');
    const [kkSearchResults, setKkSearchResults] = useState([]);
    const [selectedKK, setSelectedKK] = useState(null);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [duplicateMemberData, setDuplicateMemberData] = useState(null);

    const getInitialForm = () => {
        const lastData = localStorage.getItem('sikamali_last_member');
        const baseForm = {
            nik: '', nama: '', status_domisili: 'Penduduk Asli',
            hubungan_keluarga: '', jenis_kelamin: '', tempat_lahir: '', tanggal_lahir: '',
            agama: '', status_perkawinan: '', tanggal_perkawinan: '', pendidikan: '', pendidikan_terakhir: '',
            pekerjaan: '', status_kerja: '', tempat_bekerja: '', no_hp: '', email: '',
            golongan_darah: '', kewarganegaraan: 'WNI', no_paspor: '', no_kitap: '', nama_ayah: '', nama_ibu: '',
            status_kependudukan: 'AKTIF', keterangan: ''
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
                    status_kependudukan: parsed.status_kependudukan || 'AKTIF'
                };
            } catch (e) {
                return baseForm;
            }
        }
        return baseForm;
    };

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                tanggal_lahir: formatDateInput(initialData.tanggal_lahir),
                tanggal_perkawinan: formatDateInput(initialData.tanggal_perkawinan)
            });
            // Update KK Search and selectedKK based on initialData
            if (initialData.nomor_kk || initialData.kepala_keluarga) {
                setKkSearch(`${initialData.kepala_keluarga || ''} (${initialData.nomor_kk || ''})`);
                if (allKK) {
                    const found = allKK.find(k => k.id === initialData.kk_id || k.nomor_kk === initialData.nomor_kk);
                    if (found) setSelectedKK(found);
                }
            }
        } else {
            setForm({ ...getInitialForm(), kk_id: kkId });
            setKkSearch('');
            setSelectedKK(null);
            if (kkId && allKK) {
                const found = allKK.find(k => k.id === kkId);
                if (found) {
                    setSelectedKK(found);
                    setKkSearch(`${found.kepala_keluarga} (${found.nomor_kk})`);
                }
            }
        }
    }, [initialData, isOpen, allKK, kkId]);

    const handleKKSearch = (term) => {
        setKkSearch(term);
        if (term.length > 1 && allKK) {
            const results = allKK.filter(k =>
                (k.nomor_kk && k.nomor_kk.includes(term)) || 
                (k.kepala_keluarga && k.kepala_keluarga.toLowerCase().includes(term.toLowerCase()))
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
        setForm(prev => ({ ...prev, kk_id: kk.id }));
    };

    const checkDuplicateNIK = (val) => {
        if (!val || viewMode) return;
        // Don't check if we are editing the same person
        if (isEdit && initialData && initialData.nik === val) return;

        const duplicate = members.find(m => m.nik === val);
        if (duplicate) {
            setDuplicateMemberData(duplicate);
            setDuplicateDialogOpen(true);
        }
    };

    const handleChange = (e) => {
        if (viewMode) return;
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (viewMode) return;

        // Save defaults to history (excluding unique fields like NIK/Nama)
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
            status_kependudukan: form.status_kependudukan
        }));

        onSubmit(form);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${viewMode ? 'modal-md' : 'modal-xl'}`} onClick={e => e.stopPropagation()}>
                <div className={`modal-header ${viewMode ? 'modal-header-green' : ''}`}>
                    <h3>{viewMode ? 'Detail Anggota Keluarga' : (isEdit ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga')}</h3>
                    <button className="btn-close" onClick={onClose} title="Tutup">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {viewMode ? (
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                            <div className="detail-item"><label>NIK</label><div className="detail-value highlight">{form.nik || '-'}</div></div>
                            <div className="detail-item"><label>Nama Lengkap</label><div className="detail-value highlight">{form.nama || '-'}</div></div>
                            <div className="detail-item"><label>Jenis Kelamin</label><div className="detail-value">{form.jenis_kelamin || '-'}</div></div>
                            <div className="detail-item"><label>Umur</label><div className="detail-value">{form.tanggal_lahir ? (new Date().getFullYear() - new Date(form.tanggal_lahir).getFullYear()) + ' Tahun' : '-'}</div></div>
                            <div className="detail-item"><label>No Kartu Keluarga</label><div className="detail-value">{initialData?.nomor_kk || '-'}</div></div>
                            <div className="detail-item"><label>Kepala Keluarga</label><div className="detail-value">{initialData?.kepala_keluarga || '-'}</div></div>
                            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                <label>Tempat, Tanggal Lahir</label>
                                <div className="detail-value">
                                    {form.tempat_lahir || '-'}, {form.tanggal_lahir ? new Date(form.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                                </div>
                            </div>
                            <div className="detail-item"><label>Agama</label><div className="detail-value">{form.agama || '-'}</div></div>
                            <div className="detail-item"><label>Pendidikan Terakhir</label><div className="detail-value">{form.pendidikan || '-'}</div></div>
                            <div className="detail-item"><label>Pekerjaan</label><div className="detail-value">{form.pekerjaan || '-'}</div></div>
                            <div className="detail-item"><label>Status Perkawinan</label><div className="detail-value">{form.status_perkawinan || '-'}</div></div>
                            <div className="detail-item"><label>Nama Ayah</label><div className="detail-value">{form.nama_ayah || '-'}</div></div>
                            <div className="detail-item"><label>Nama Ibu</label><div className="detail-value">{form.nama_ibu || '-'}</div></div>
                            <div className="detail-item"><label>No HP / WA</label><div className="detail-value">{form.no_hp || '-'}</div></div>
                            <div className="detail-item"><label>E-mail</label><div className="detail-value">{form.email || '-'}</div></div>
                            <div className="detail-item">
                                <label>Status Domisili</label>
                                <div className="detail-value">
                                    <span style={{ 
                                        color: (() => {
                                            const s = (form.status_domisili || '').toLowerCase();
                                            if (s.includes('meninggal')) return '#ef4444';
                                            if (s.includes('pindah')) return '#f59e0b';
                                            if (s.includes('pendatang')) return '#3b82f6';
                                            return '#10b981';
                                        })(),
                                        fontWeight: 'bold'
                                    }}>
                                        {form.status_domisili || '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="detail-item"><label>Status Kependudukan</label><div className="detail-value">{form.status_kependudukan || 'AKTIF'}</div></div>
                            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                <label>Keterangan</label>
                                <div className="detail-value">{form.keterangan || '-'}</div>
                            </div>
                        </div>
                    ) : (
                        <form id="memberForm" onSubmit={handleSubmit}>
                            {/* KK Selection Section */}
                            <div className="form-group" style={{ position: 'relative', marginBottom: '1.5rem', gridColumn: 'span 2' }}>
                                <label>Cari Kepala Keluarga / No Kartu Keluarga *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ketik nama atau nomor KK..."
                                        value={kkSearch}
                                        onChange={e => handleKKSearch(e.target.value)}
                                        autoComplete="off"
                                        style={{ flex: 1 }}
                                    />
                                    {selectedKK && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: '#ecfdf5', padding: '0 12px', borderRadius: '8px', color: '#065f46', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                                            <CheckCircleIcon style={{ fontSize: 16, marginRight: 4 }} /> Terpilih
                                        </div>
                                    )}
                                </div>
                                {kkSearchResults.length > 0 && (
                                    <ul className="user-suggestions" style={{ top: '100%', left: 0, right: 0, zIndex: 10 }}>
                                        {kkSearchResults.slice(0, 5).map(kk => (
                                            <li key={kk.id} className="item" onClick={() => selectKK(kk)}>
                                                <div className="primary">{kk.kepala_keluarga}</div>
                                                <div className="secondary">{kk.nomor_kk} - {kk.desa}</div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {selectedKK && (
                                <div className="user-info-box" style={{ gridColumn: 'span 2', marginBottom: '1.5rem', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Kepala Keluarga</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedKK.kepala_keluarga}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>No Kartu Keluarga</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{selectedKK.nomor_kk}</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>NIK *</label>
                                    <input 
                                        name="nik" 
                                        value={form.nik} 
                                        onChange={handleChange} 
                                        onBlur={(e) => checkDuplicateNIK(e.target.value)}
                                        required 
                                        maxLength="16" 
                                        className="input-field" 
                                    />
                                </div>
                            <div className="form-group">
                                <label>Nama Lengkap *</label>
                                <input name="nama" value={form.nama} onChange={handleChange} required className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Status Domisili</label>
                                <select name="status_domisili" value={form.status_domisili} onChange={handleChange} className="input-field">
                                    <option value="Penduduk Asli">PENDUDUK ASLI</option>
                                    <option value="Pendatang">PENDATANG</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hubungan Keluarga</label>
                                <select 
                                    name="hubungan_keluarga" 
                                    value={form.hubungan_keluarga} 
                                    onChange={handleChange} 
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
                                <select name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleChange} className="input-field">
                                    <option value="">Pilih</option>
                                    <option value="Laki-laki">LAKI-LAKI</option>
                                    <option value="Perempuan">PEREMPUAN</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tempat Lahir</label>
                                <input name="tempat_lahir" value={form.tempat_lahir} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Tanggal Lahir</label>
                                <input type="date" name="tanggal_lahir" value={form.tanggal_lahir} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Agama</label>
                                <select name="agama" value={form.agama} onChange={handleChange} className="input-field">
                                    <option value="">Pilih</option>
                                    <option value="Islam">ISLAM</option>
                                    <option value="Kristen">KRISTEN PROTESTAN</option>
                                    <option value="Katolik">KATOLIK</option>
                                    <option value="Hindu">HINDU</option>
                                    <option value="Buddha">BUDDHA</option>
                                    <option value="Konghucu">KONGHUCU</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Pendidikan</label>
                                <select 
                                    name="pendidikan" 
                                    value={form.pendidikan} 
                                    onChange={handleChange} 
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
                                    onChange={handleChange} 
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
                                <select name="golongan_darah" value={form.golongan_darah} onChange={handleChange} className="input-field">
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
                                    onChange={handleChange} 
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
                                <input type="date" name="tanggal_perkawinan" value={form.tanggal_perkawinan} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Kewarganegaraan</label>
                                <select name="kewarganegaraan" value={form.kewarganegaraan} onChange={handleChange} className="input-field">
                                    <option value="WNI">WNI</option>
                                    <option value="WNA">WNA</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>No. Paspor</label>
                                <input name="no_paspor" value={form.no_paspor} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>No. KITAP</label>
                                <input name="no_kitap" value={form.no_kitap} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Nama Ayah</label>
                                <input name="nama_ayah" value={form.nama_ayah} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Nama Ibu</label>
                                <input name="nama_ibu" value={form.nama_ibu} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>No. HP / WA</label>
                                <input name="no_hp" value={form.no_hp} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Email (Opsional)</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" />
                            </div>
                            <div className="form-group">
                                <label>Status Kependudukan</label>
                                <select name="status_kependudukan" value={form.status_kependudukan} onChange={handleChange} className="input-field">
                                    <option value="AKTIF">AKTIF</option>
                                    <option value="PINDAH">PINDAH</option>
                                    <option value="TIDAK AKTIF">TIDAK AKTIF</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Keterangan</label>
                                <textarea name="keterangan" value={form.keterangan} onChange={handleChange} className="input-field" rows="2" style={{ resize: 'vertical' }} />
                            </div>
                        </div>
                    </form>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        {viewMode ? 'Tutup' : 'Batal'}
                    </button>
                    {!viewMode && (
                        <button type="submit" form="memberForm" className="btn-primary">
                            Simpan
                        </button>
                    )}
                </div>
            </div>

            {/* DUPLICATE NIK DIALOG */}
            <Dialog 
                open={duplicateDialogOpen} 
                onClose={() => setDuplicateDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 4, maxWidth: 450, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } }}
            >
                <DialogTitle sx={{ 
                    bgcolor: '#ecfdf5', 
                    color: '#065f46', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    fontWeight: 'bold',
                    borderBottom: '4px solid #10b981'
                }}>
                    <WarningIcon sx={{ color: '#10b981' }} /> Peringatan: Data Duplikat
                </DialogTitle>
                <DialogContent sx={{ mt: 3, px: 3 }}>
                    <Typography variant="h6" sx={{ color: '#065f46', mb: 2, fontWeight: '800', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
                        NOMOR KK/ NIK YANG ANDA INPUT SUDAH TERDAFTAR*
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.6 }}>
                        NIK <strong style={{ color: '#10b981' }}>{form.nik}</strong> sudah ada di database atas nama <strong>{duplicateMemberData?.nama}</strong>.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                        fullWidth
                        variant="contained" 
                        onClick={() => {
                            setDuplicateDialogOpen(false);
                            onClose(); // Close the modal so user can find the existing one in the list
                        }}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 'bold', 
                            py: 1.8, 
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.5)',
                            }
                        }}
                    >
                        1. Lanjutkan proses dengan mengedit no KK lama
                    </Button>
                    <Button 
                        fullWidth
                        variant="outlined" 
                        onClick={() => {
                            setDuplicateDialogOpen(false);
                            setForm({ ...form, nik: '' });
                        }}
                        sx={{ 
                            textTransform: 'none', 
                            py: 1.5, 
                            borderRadius: '12px', 
                            borderColor: '#d1d5db', 
                            color: '#4b5563',
                            fontWeight: '600',
                            '&:hover': {
                                borderColor: '#10b981',
                                color: '#10b981',
                                bgcolor: '#ecfdf5'
                            }
                        }}
                    >
                        2. Lanjutkan dengan input no KK baru
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default MemberFormModal;
