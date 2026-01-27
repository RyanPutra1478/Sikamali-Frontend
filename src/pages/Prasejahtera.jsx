import React, { useState, useEffect } from 'react';
import { userServiceAPI } from '../services/api';
import './Prasejahtera.css';

export default function Prasejahtera() {
  const [nomorKK, setNomorKK] = useState('');
  const [kkData, setKkData] = useState(null);
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
      const result = await userServiceAPI.getPrasejahteraList();
      setHistory(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('History error:', err);
      setError('Gagal memuat riwayat data');
    } finally {
      setHistoryLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    income_per_month: '',
    house_condition: '',
    access_listrik_air: false,
    is_prasejahtera: false,
    assessment_notes: '',
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nomorKK || nomorKK.length !== 16) {
      setError('Nomor KK harus 16 digit');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await userServiceAPI.searchKK(nomorKK);
      if (data) {
        setKkData(data);
        setFormReady(true);
        setMessage('Data KK ditemukan. Silakan isi formulir di bawah.');
      } else {
        setError('Data KK tidak ditemukan');
        setFormReady(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Terjadi kesalahan saat mencari data KK');
      setFormReady(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formReady || !kkData) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        nomor_kk: nomorKK,
        ...formData,
        kk_data: kkData
      };

      const result = await userServiceAPI.createOrUpdatePrasejahtera(payload);
      if (result) {
        setMessage('Data berhasil disimpan');
        setFormData({
          income_per_month: '',
          house_condition: '',
          access_listrik_air: false,
          is_prasejahtera: false,
          assessment_notes: '',
        });
        setKkData(null);
        setNomorKK('');
        setFormReady(false);
        loadHistory();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Gagal menyimpan data: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prasejahtera-container">
      <h1>Formulir Data Prasejahtera</h1>
      
      <div className="search-section">
        <h2>Cari Data KK</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={nomorKK}
            onChange={(e) => setNomorKK(e.target.value)}
            placeholder="Masukkan Nomor KK (16 digit)"
            maxLength="16"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !nomorKK}>
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}
      </div>

      {formReady && kkData && (
        <div className="form-section">
          <h2>Data Keluarga</h2>
          <div className="family-info">
            <p><strong>Nomor KK:</strong> {kkData.nomor_kk}</p>
            <p><strong>Kepala Keluarga:</strong> {kkData.nama_kepala_keluarga}</p>
            <p><strong>Alamat:</strong> {kkData.alamat}</p>
          </div>

          <form onSubmit={handleSubmit} className="prasejahtera-form">
            <h3>Formulir Penilaian</h3>
            
            <div className="form-group">
              <label>Penghasilan per Bulan (Rupiah)</label>
              <input
                type="number"
                name="income_per_month"
                value={formData.income_per_month}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Kondisi Rumah</label>
              <select
                name="house_condition"
                value={formData.house_condition}
                onChange={handleInputChange}
                required
              >
                <option value="">Pilih Kondisi Rumah</option>
                <option value="layak">Layak Huni</option>
                <option value="tidak_layak">Tidak Layak Huni</option>
                <option value="sangat_tidak_layak">Sangat Tidak Layak</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="access_listrik_air"
                  checked={formData.access_listrik_air}
                  onChange={handleInputChange}
                />
                Akses Listrik dan Air Bersih
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_prasejahtera"
                  checked={formData.is_prasejahtera}
                  onChange={handleInputChange}
                />
                Termasuk Keluarga Prasejahtera
              </label>
            </div>

            <div className="form-group">
              <label>Catatan Penilaian</label>
              <textarea
                name="assessment_notes"
                value={formData.assessment_notes}
                onChange={handleInputChange}
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setFormReady(false);
                  setKkData(null);
                  setNomorKK('');
                  setFormData({
                    income_per_month: '',
                    house_condition: '',
                    access_listrik_air: false,
                    is_prasejahtera: false,
                    assessment_notes: '',
                  });
                }}
              >
                Batal
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="history-section">
        <h2>Riwayat Pengajuan</h2>
        {historyLoading ? (
          <p>Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p>Belum ada riwayat pengajuan</p>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <h4>KK: {item.nomor_kk}</h4>
                <p>Status: {item.status || 'Diproses'}</p>
                <p>Tanggal: {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}