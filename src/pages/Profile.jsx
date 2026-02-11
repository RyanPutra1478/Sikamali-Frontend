import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import { profileAPI } from '../services/api';
import './Profile.css';

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

// Terima props onUpdateUser dari App.jsx
export default function Profile({ onUpdateUser }) {
  const location = useLocation();
  const alertMessage = location.state?.alert; // Tangkap pesan dari App.jsx

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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await profileAPI.get();
      if (data && Object.keys(data).length > 0) {
        let formattedDate = '';
        if (data.tanggal_lahir) {
          formattedDate = typeof data.tanggal_lahir === 'string' && data.tanggal_lahir.includes('T')
            ? data.tanggal_lahir.split('T')[0]
            : data.tanggal_lahir;
        }
        
        setFormData({
          nama: data.nama || '',
          nik: data.nik || '',
          tempat_lahir: data.tempat_lahir || '',
          tanggal_lahir: formattedDate || '',
          alamat: data.alamat || '',
          pendidikan: data.pendidikan || '',
          pekerjaan: data.pekerjaan || '',
          telepon: data.telepon || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Update ke Backend
      const response = await profileAPI.update(formData);
      
      setMessage('Profil berhasil diperbarui! Akses fitur dibuka.');
      
      // Update State Global di App.jsx agar menu lain bisa diakses
      if (onUpdateUser && response.user) {
        onUpdateUser(response.user);
      } else if (onUpdateUser) {
        // Fallback jika response tidak mengembalikan user object lengkap
        onUpdateUser(formData); 
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="profile-page"><p style={{textAlign:'center', padding:'20px'}}>Memuat...</p></div>;

  return (
    <div className="profile-page">
      
      {/* Tampilkan Alert Peringatan di sini */}
      {alertMessage && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #ffeeba'
        }}>
          ⚠️ <strong>Perhatian:</strong> {alertMessage}
        </div>
      )}

      <h2>Lengkapi Profil Saya</h2>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nama Lengkap *</label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              placeholder="Sesuai KTP"
            />
          </div>
          
          <div className="form-group">
            <label>NIK *</label>
            <input
              type="text"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              required
              placeholder="Nomor Induk Kependudukan"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tempat Lahir</label>
            <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Tanggal Lahir</label>
            <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Alamat Lengkap *</label>
          <textarea
            name="alamat"
            value={formData.alamat}
            onChange={handleChange}
            rows="3"
            required
            placeholder="Jalan, RT/RW, Desa, Kecamatan..."
          />
        </div>

        {/* Sisa input lainnya tetap sama... */}
        <div className="form-row">
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
            <select 
              name="pekerjaan" 
              value={OCCUPATION_OPTIONS.includes(formData.pekerjaan) ? formData.pekerjaan : (formData.pekerjaan ? "PEKERJAAN LAINNYA" : "")} 
              onChange={handleChange}
            >
              <option value="">Pilih Pekerjaan</option>
              {OCCUPATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            {/* Manual Input if "PEKERJAAN LAINNYA" is selected OR if the value is not in the predefined list */}
            {((formData.pekerjaan === "PEKERJAAN LAINNYA") || (formData.pekerjaan && !OCCUPATION_OPTIONS.includes(formData.pekerjaan))) && (
              <input
                type="text"
                placeholder="Masukkan jenis pekerjaan..."
                className="input-field"
                style={{ marginTop: '10px' }}
                value={formData.pekerjaan === "PEKERJAAN LAINNYA" ? "" : formData.pekerjaan}
                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value.toUpperCase() })}
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Telepon / WA</label>
          <input type="tel" name="telepon" value={formData.telepon} onChange={handleChange} />
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </form>
    </div>
  );
}