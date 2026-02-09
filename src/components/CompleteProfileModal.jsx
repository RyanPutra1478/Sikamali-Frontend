import React, { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import './CompleteProfileModal.css'; // Kita buat CSS-nya nanti

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

export default function CompleteProfileModal({ user, onComplete, onClose }) {
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    pendidikan: '',
    pekerjaan: '',
    telepon: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Isi form awal dengan data user yang sudah ada (jika ada sebagian)
  useEffect(() => {
    if (user) {
      let formattedDate = '';
      if (user.tanggal_lahir) {
        formattedDate = typeof user.tanggal_lahir === 'string' && user.tanggal_lahir.includes('T')
          ? user.tanggal_lahir.split('T')[0]
          : user.tanggal_lahir;
      }
      setFormData({
        nama: user.nama || '',
        nik: user.nik || '',
        tempat_lahir: user.tempat_lahir || '',
        tanggal_lahir: formattedDate || '',
        alamat: user.alamat || '',
        pendidikan: user.pendidikan || '',
        pekerjaan: user.pekerjaan || '',
        telepon: user.telepon || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Kirim update ke backend
      const response = await profileAPI.update(formData);
      
      // Panggil fungsi induk untuk membuka gembok aplikasi
      if (onComplete) {
        // Gunakan data user dari response backend jika ada, atau gunakan formData
        onComplete(response.user || formData);
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="btn-close-modal" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="modal-header">
          <h3>⚠️ Lengkapi Profil Anda</h3>
          <p>Mohon lengkapi data diri Anda sebelum mengakses fitur aplikasi.</p>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input name="nama" value={formData.nama} onChange={handleChange} required placeholder="Sesuai KTP" />
            </div>
            <div className="form-group">
              <label>NIK *</label>
              <input name="nik" value={formData.nik} onChange={handleChange} required placeholder="16 Digit NIK" />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Tempat Lahir</label>
              <input name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Tanggal Lahir</label>
              <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Alamat Lengkap *</label>
            <textarea name="alamat" value={formData.alamat} onChange={handleChange} required rows="3" placeholder="Jalan, RT/RW, Desa..." />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Pendidikan</label>
              <select name="pendidikan" value={formData.pendidikan} onChange={handleChange}>
                <option value="">Pilih Pendidikan</option>
                {EDUCATION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Telepon / WA</label>
              <input name="telepon" value={formData.telepon} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Status Perkawinan</label>
            <select name="status_perkawinan" value={formData.status_perkawinan} onChange={handleChange}>
              <option value="">Pilih Status</option>
              {MARITAL_STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Pekerjaan</label>
            <select name="pekerjaan" value={formData.pekerjaan} onChange={handleChange}>
              <option value="">Pilih Pekerjaan</option>
              {OCCUPATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-save-modal" disabled={loading}>
            {loading ? 'Menyimpan...' : 'SIMPAN & LANJUTKAN'}
          </button>
        </form>
      </div>
    </div>
  );
}