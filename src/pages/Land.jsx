import React, { useState, useEffect, useMemo } from "react";
import { landAPI } from "../services/api";
import { MapPin } from 'lucide-react';
import "./Land.css";

export default function Land({ user }) {
  const [landPlots, setLandPlots] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [kkData, setKkData] = useState(null);
  const [loadingKK, setLoadingKK] = useState(false);

  const [fotoRumah, setFotoRumah] = useState(null);
  const [fotoRumahPreview, setFotoRumahPreview] = useState(null);

  const [formData, setFormData] = useState({
    nomor_kk: "",
    lat: "",
    lng: "",
    cert_number: "",
    area_m2: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [kkSuggestions, setKkSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadLandPlots();
  }, []);

  const loadLandPlots = async () => {
    setLoading(true);
    try {
      const data = await landAPI.get();
      setLandPlots(data);
    } catch (err) {
      setMessage("Gagal memuat data lokasi.");
    } finally {
      setLoading(false);
    }
  };

  const loadKKData = async (nomor_kk) => {
    if (!nomor_kk || nomor_kk.length !== 16) {
      setKkData(null);
      return;
    }
    setLoadingKK(true);
    setError("");
    try {
      const data = await landAPI.getKKByNomor(nomor_kk);
      setKkData(data);
      setShowSuggestions(false);
    } catch (err) {
      setError("Data KK tidak ditemukan.");
      setKkData(null);
    } finally {
      setLoadingKK(false);
    }
  };

  const handleNomorKKChange = async (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, nomor_kk: val }));
    if (val.length > 2) {
      try {
        const results = await landAPI.searchKK(val);
        setKkSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Gagal search KK:", err);
      }
    } else {
      setKkSuggestions([]);
      setShowSuggestions(false);
    }
    if (val.length === 16) {
      loadKKData(val);
    } else {
      setKkData(null);
    }
  };

  const selectSuggestion = (item) => {
    setFormData((prev) => ({ ...prev, nomor_kk: item.nomor_kk }));
    setKkSuggestions([]);
    setShowSuggestions(false);
    loadKKData(item.nomor_kk);
  };

  const handleCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoRumahChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoRumah(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoRumahPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (plot) => {
    setFormData({
      nomor_kk: plot.nomor_kk || "",
      lat: plot.lat?.toString() || "",
      lng: plot.lng?.toString() || "",
      cert_number: plot.cert_number || "",
      area_m2: plot.area_m2?.toString() || "",
    });
    setEditingId(plot.id);
    setIsEditing(true);
    setShowForm(true);
    if (plot.nomor_kk) loadKKData(plot.nomor_kk);
    setFotoRumahPreview(`${import.meta.env.VITE_API_URL || "http://192.168.0.254:5000/api"}/land/foto/${plot.foto_rumah}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data lokasi ini?")) return;
    try {
      await landAPI.remove(id);
      loadLandPlots();
      setMessage("Data berhasil dihapus.");
    } catch (err) {
      setMessage("Gagal menghapus data: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({ nomor_kk: "", lat: "", lng: "", cert_number: "", area_m2: "" });
    setKkData(null);
    setFotoRumah(null);
    setFotoRumahPreview(null);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
    setError("");
    setKkSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (!formData.nomor_kk) {
      setError("Nomor KK wajib diisi.");
      setLoading(false);
      return;
    }
    if (!formData.lat || !formData.lng) {
      setError("Koordinat (Latitude dan Longitude) wajib diisi.");
      setLoading(false);
      return;
    }
    try {
      const payload = {
        nomor_kk: formData.nomor_kk,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        cert_number: formData.cert_number || null,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : null,
      };
      if (isEditing) {
        await landAPI.update(editingId, payload, fotoRumah);
        setMessage("Lokasi berhasil diperbarui!");
      } else {
        await landAPI.create(payload, fotoRumah);
        setMessage("Lokasi tanah berhasil disimpan!");
      }
      resetForm();
      loadLandPlots();
    } catch (err) {
      setError("Error: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const mapEmbedUrl = useMemo(() => {
    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (Number.isNaN(lat) || Number.isNaN(lng) || !apiKey) return null;
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=18&maptype=satellite`;
  }, [formData.lat, formData.lng]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          }));
        },
        (err) => {
          setError("Tidak dapat mengambil lokasi saat ini: " + err.message);
        }
      );
    } else {
      setError("Browser tidak mendukung geolocation");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-title-section">
          <div className="section-badge">Pemetaan Wilayah</div>
          <h2><MapPin size={32} /> Lokasi Rumah</h2>
          <p className="header-subtitle">
            Kelola koordinat tempat tinggal Anda untuk akurasi data bantuan dan administrasi desa.
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className={`btn-toggle ${showForm ? "btn-cancel" : "btn-add-new"}`}
          >
            {showForm ? "Batal / Tutup" : "+ Tambah Lokasi"}
          </button>
        </div>
      </div>

      {(message || error) && (
        <div className={`message ${error || message.toLowerCase().includes("error") || message.includes("Gagal") ? "error" : "success"}`}>
          {error || message}
        </div>
      )}

      {showForm && (
        <div className="land-form-container">
          <div className="form-header-line"></div>
          <h3>{isEditing ? "Edit Data Lokasi" : "Input Lokasi Baru"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ position: "relative" }}>
              <label>Nomor KK * (Cari / Ketik)</label>
              <input type="text" name="nomor_kk" value={formData.nomor_kk} onChange={handleNomorKKChange} placeholder="Ketik Nomor KK atau Nama..." required maxLength={16} autoComplete="off" />
              {showSuggestions && kkSuggestions.length > 0 && (
                <ul className="suggestions-list">
                  {kkSuggestions.map((item, idx) => (
                    <li key={idx} onClick={() => selectSuggestion(item)}>
                      <strong>{item.nomor_kk}</strong>
                      <span> - {item.kepala_keluarga}</span>
                    </li>
                  ))}
                </ul>
              )}
              {loadingKK && <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.25rem" }}>Memuat data KK...</p>}
            </div>
            {kkData && (
              <div className="kk-info-box" style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
                <h4 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Data Kartu Keluarga</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <p><strong>Nomor KK:</strong> {kkData.nomor_kk}</p>
                  <p><strong>Kepala Keluarga:</strong> {kkData.kepala_keluarga}</p>
                  <p><strong>Alamat:</strong> {kkData.alamat}</p>
                  {kkData.provinsi && <p><strong>Provinsi:</strong> {kkData.provinsi}</p>}
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Latitude (Garis Lintang) *</label>
                <input type="number" step="any" name="lat" value={formData.lat} onChange={handleCoordChange} required placeholder="-5.147..." />
              </div>
              <div className="form-group">
                <label>Longitude (Garis Bujur) *</label>
                <input type="number" step="any" name="lng" value={formData.lng} onChange={handleCoordChange} required placeholder="119.432..." />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <button type="button" onClick={getCurrentLocation} className="btn-secondary" style={{ fontSize: "0.9rem" }}>📍 Gunakan Lokasi Saat Ini</button>
            </div>
            {mapEmbedUrl && (
              <div className="map-preview-container">
                <p className="preview-label">Preview Lokasi:</p>
                <div className="iframe-wrapper">
                  <iframe title="preview" src={mapEmbedUrl} loading="lazy" style={{ width: "100%", height: "400px", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
                </div>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>No. Sertifikat (Opsional)</label>
                <input type="text" name="cert_number" value={formData.cert_number} onChange={(e) => setFormData((prev) => ({ ...prev, cert_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Luas Area (m²) (Opsional)</label>
                <input type="number" name="area_m2" value={formData.area_m2} onChange={(e) => setFormData((prev) => ({ ...prev, area_m2: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Foto Rumah (Opsional)</label>
              <input type="file" accept="image/*" onChange={handleFotoRumahChange} style={{ marginBottom: "0.5rem" }} />
              {fotoRumahPreview && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img src={fotoRumahPreview} alt="Preview Foto Rumah" style={{ maxWidth: "300px", maxHeight: "200px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
                </div>
              )}
            </div>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Lokasi"}
            </button>
          </form>
        </div>
      )}

      <div className="land-list">
        <h3>Daftar Lokasi Tersimpan</h3>
        {loading && !landPlots.length && <p>Memuat data...</p>}
        {landPlots.length === 0 && !loading ? (
          <div className="empty-state"><p>Belum ada data lokasi yang tersimpan.</p></div>
        ) : (
          <div className="land-grid">
            {landPlots.map((plot) => (
              <div key={plot.id} className="land-card">
                <div className="card-header">
                  <h4>{plot.kepala_keluarga || plot.title || "Lokasi Tanpa Judul"}</h4>
                  <span className="icon-map">📍</span>
                </div>
                <div className="card-body">
                  <div className="coord-box"><small>Nomor KK:</small><p>{plot.nomor_kk || "-"}</p></div>
                  <div className="coord-box"><small>Koordinat:</small><p>{Number(plot.lat)?.toFixed(6)}, {Number(plot.lng)?.toFixed(6)}</p></div>
                  <div className="detail-row"><span>Luas Area</span><strong>{plot.area_m2 ? `${plot.area_m2} m²` : "-"}</strong></div>
                  {plot.foto_rumah && <div className="detail-row"><span>Foto Rumah</span><strong>✅ Tersedia</strong></div>}
                </div>
                <div className="card-actions">
                  {user && (user.role === "admin" || user.role === "superadmin") && (
                    <>
                      <button className="btn-action edit" onClick={() => handleEditClick(plot)}>Edit</button>
                      <button className="btn-action delete" onClick={() => handleDelete(plot.id)}>Hapus</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
