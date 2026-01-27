import React, { useState, useEffect } from 'react';
import { userServiceAPI } from '../services/api';
import './Kesejahteraan.css';

export default function Kesejahteraan() {
  const [nik, setNik] = useState('');
  const [pendudukData, setPendudukData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const result = await userServiceAPI.getKesejahteraanList();
      setHistory(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('History error:', err);
      setError('Gagal memuat riwayat data');
    } finally {
      setHistoryLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    nama: '',
    jenis_pekerjaan: '',
    nama_perusahaan: '',
    pendapatan_per_bulan: '',
    status_pekerjaan: '',
    keterangan: '',
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nik || nik.length !== 16) {
      setError('NIK harus 16 digit');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await userServiceAPI.searchEmployment(nik);
      if (data) {
        setPendudukData(data);
        setFormData(prev => ({
          ...prev,
          nama: data.nama || '',
          jenis_pekerjaan: data.jenis_pekerjaan || '',
          nama_perusahaan: data.nama_perusahaan || '',
          pendapatan_per_bulan: data.pendapatan_per_bulan || '',
          status_pekerjaan: data.status_pekerjaan || '',
          keterangan: data.keterangan || '',
        }));
        setFormReady(true);
        setMessage('Data penduduk ditemukan. Silakan perbarui data pekerjaan di bawah.');
      } else {
        setError('Data penduduk tidak ditemukan');
        setFormReady(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Terjadi kesalahan saat mencari data penduduk');
      setFormReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formReady || !pendudukData) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        nik: nik,
        ...formData
      };

      const result = await userServiceAPI.updateEmployment(payload);
      if (result) {
        setMessage('Data kesejahteraan berhasil diperbarui');
        setFormData({
          nama: '',
          jenis_pekerjaan: '',
          nama_perusahaan: '',
          pendapatan_per_bulan: '',
          status_pekerjaan: '',
          keterangan: '',
        });
        setPendudukData(null);
        setNik('');
        setFormReady(false);
        loadHistory();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Gagal memperbarui data: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kesejahteraan-container">
      <h1>Formulir Data Kesejahteraan</h1>
      
      <div className="search-section">
        <h2>Cari Data Penduduk</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            placeholder="Masukkan NIK (16 digit)"
            maxLength="16"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !nik}>
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
      </div>

      {formReady && pendudukData && (
        <div className="form-section">
          <h2>Data Pribadi</h2>
          <div className="personal-info">
            <p><strong>NIK:</strong> {pendudukData.nik}</p>
            <p><strong>Nama:</strong> {pendudukData.nama}</p>
            <p><strong>Alamat:</strong> {pendudukData.alamat || '-'}</p>
          </div>

          <form onSubmit={handleSubmit} className="kesejahteraan-form">
            <h3>Data Pekerjaan</h3>
            
            <div className="form-group">
              <label>Jenis Pekerjaan</label>
              <select
                name="jenis_pekerjaan"
                value={formData.jenis_pekerjaan}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Jenis Pekerjaan</option>
                <option value="PNS">PNS</option>
                <option value="Karyawan Swasta">Karyawan Swasta</option>
                <option value="Wiraswasta">Wiraswasta</option>
                <option value="Petani">Petani</option>
                <option value="Nelayan">Nelayan</option>
                <option value="Pensiunan">Pensiunan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nama Perusahaan/Usaha</label>
              <input
                type="text"
                name="nama_perusahaan"
                value={formData.nama_perusahaan}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Pendapatan per Bulan (Rupiah)</label>
              <input
                type="number"
                name="pendapatan_per_bulan"
                value={formData.pendapatan_per_bulan}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Status Pekerjaan</label>
              <select
                name="status_pekerjaan"
                value={formData.status_pekerjaan}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Status Pekerjaan</option>
                <option value="Tetap">Tetap</option>
                <option value="Kontrak">Kontrak</option>
                <option value="Harian Lepas">Harian Lepas</option>
                <option value="Musiman">Musiman</option>
              </select>
            </div>

            <div className="form-group">
              <label>Keterangan Tambahan</label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                rows="3"
                placeholder="Keterangan tambahan (opsional)"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setFormReady(false);
                  setPendudukData(null);
                  setNik('');
                  setFormData({
                    nama: '',
                    jenis_pekerjaan: '',
                    nama_perusahaan: '',
                    pendapatan_per_bulan: '',
                    status_pekerjaan: '',
                    keterangan: '',
                  });
                }}
              >
                Batal
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="history-section">
        <h2>Riwayat Pembaruan</h2>
        {historyLoading ? (
          <p>Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p>Belum ada riwayat pembaruan</p>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <h4>NIK: {item.nik}</h4>
                <p>Pekerjaan: {item.jenis_pekerjaan}</p>
                <p>Perusahaan: {item.nama_perusahaan}</p>
                <p>Status: {item.status_pekerjaan}</p>
                <p>Diperbarui: {new Date(item.updated_at || new Date()).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}