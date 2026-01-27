import React, { useState, useEffect } from 'react';
import { complaintAPI } from '../services/api';
import './Complaints.css';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(''); // Rename agar tidak clash dengan formData.message

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await complaintAPI.get();
      setComplaints(data);
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg('');
    
    try {
      await complaintAPI.create(formData.title, formData.message);
      setStatusMsg('Aduan berhasil dikirim!');
      setFormData({ title: '', message: '' });
      loadComplaints();
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err) {
      setStatusMsg('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Menunggu',
      in_progress: 'Diproses',
      closed: 'Selesai',
    };
    return labels[status] || status;
  };

  return (
    <div className="complaints-page">
      <div className="complaints-header">
        <div>
           <p className="section-label">Layanan Masyarakat</p>
           <h2>Kotak Aduan & Aspirasi</h2>
        </div>
      </div>

      <div className="complaint-layout">
        {/* KOLOM KIRI: FORM INPUT */}
        <div className="complaint-form-section">
          <div className="form-header-line"></div>
          <h3>Buat Aduan Baru</h3>
          <p className="form-subtitle">Sampaikan keluhan atau saran Anda untuk kemajuan desa.</p>
          
          <form onSubmit={handleSubmit} className="complaint-form">
            <div className="form-group">
              <label>Judul Aduan / Topik *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder=""
              />
            </div>

            <div className="form-group">
              <label>Isi Pesan Lengkap *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Jelaskan detail aduan Anda di sini..."
              />
            </div>

            {statusMsg && (
              <div className={`message ${statusMsg.toLowerCase().includes('error') ? 'error' : 'success'}`}>
                {statusMsg}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Mengirim...' : 'Kirim Aduan'}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: DAFTAR ADUAN */}
        <div className="complaints-list-section">
           <h3>Riwayat Aduan</h3>
           
           {loading ? (
             <p className="loading-text">Memuat data...</p>
           ) : complaints.length === 0 ? (
             <div className="empty-state">
               <p>Belum ada aduan yang dikirim.</p>
             </div>
           ) : (
             <div className="complaints-grid">
               {complaints.map((complaint) => (
                 <div key={complaint.id} className={`complaint-card status-border-${complaint.status}`}>
                   <div className="complaint-header-row">
                     <span className={`status-badge status-${complaint.status}`}>
                       {getStatusLabel(complaint.status)}
                     </span>
                     <span className="complaint-date">
                       {new Date(complaint.created_at).toLocaleDateString('id-ID', {
                         day: 'numeric', month: 'short', year: 'numeric'
                       })}
                     </span>
                   </div>
                   
                   <h4>{complaint.title}</h4>
                   <p className="complaint-message">{complaint.message}</p>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}