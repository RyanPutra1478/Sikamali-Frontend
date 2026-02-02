import React, { useState, useEffect, useMemo, useRef } from "react";
import { adminAPI } from "../services/api";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Search } from 'lucide-react';
import "./AdminTables.css";
import "./AdminPage.css";

// Fix Leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

let RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map centering
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

// Component to fix "cut-off" gray area issue
function MapResizer({ data }) {
  const map = useMap();
  useEffect(() => {
    // Small delay to ensure container dimensions are settled
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map, data]); // Re-run if data/map changes
  return null;
}

const AdminLand = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const detailsRef = useRef(null);

  // Auto-scroll to details when an item is selected
  useEffect(() => {
    if (selectedItem && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedItem]);

  const villages = useMemo(() => {
    const list = data.map(item => item.desa).filter(Boolean);
    return [...new Set(list)].sort();
  }, [data]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getLand();
      setData(response);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data lokasi & domisili.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        item.nomor_kk?.includes(search) ||
        item.kepala_keluarga?.toLowerCase().includes(search) ||
        item.alamat?.toLowerCase().includes(search) ||
        item.alamat_kk?.toLowerCase().includes(search) ||
        item.desa?.toLowerCase().includes(search) ||
        item.kecamatan?.toLowerCase().includes(search);
      
      const matchesDesa = !selectedDesa || item.desa === selectedDesa;

      return matchesSearch && matchesDesa;
    });
  }, [data, searchTerm, selectedDesa]);

  // Auto-select when search result is unique
  useEffect(() => {
    if (searchTerm && filteredData.length === 1) {
      setSelectedItem(filteredData[0]);
    }
  }, [searchTerm, filteredData]);

  // Center the map based on data or default
  const mapViewState = useMemo(() => {
    if (selectedItem && (selectedItem.latitude || selectedItem.lat)) {
      return {
        center: [parseFloat(selectedItem.latitude || selectedItem.lat), parseFloat(selectedItem.longitude || selectedItem.lng)],
        zoom: 18
      };
    }
    const withCoords = filteredData.find(d => (d.latitude || d.lat) && (d.longitude || d.lng));
    if (withCoords) {
      const lat = parseFloat(withCoords.latitude || withCoords.lat);
      const lng = parseFloat(withCoords.longitude || withCoords.lng);
      return { center: [lat, lng], zoom: 13 };
    }
    return { center: [-5.147665, 119.432731], zoom: 11 };
  }, [filteredData, selectedItem]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-title-section">
          <h2><MapPin size={32} /> Lokasi & Domisili</h2>
          <p className="header-subtitle">
            Peta sebaran rumah warga dan pemetaan zona kependudukan berdasarkan koordinat presisi.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <p className="loading-text">Memuat data...</p>
        </div>
      ) : error ? (
        <div className="error-box" style={{ margin: "2rem", padding: "1rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px" }}>
          {error}
        </div>
      ) : (
        <>
          <div className="map-widget" style={{ marginBottom: "2rem" }}>
            <div style={{
              height: "650px",
              width: "100%",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              zIndex: 0
            }}>
              <MapContainer
                center={mapViewState.center}
                zoom={mapViewState.zoom}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                attributionControl={false}
              >
                <ChangeView center={mapViewState.center} zoom={mapViewState.zoom} />
                <MapResizer data={filteredData} />
                <TileLayer
                  attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                  url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                  subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                />
                {filteredData.map((item) => {
                  const lat = parseFloat(item.latitude || item.lat);
                  const lng = parseFloat(item.longitude || item.lng);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <Marker 
                      key={item.id} 
                      position={[lat, lng]}
                      icon={isSelected ? RedIcon : DefaultIcon}
                      eventHandlers={{ click: () => setSelectedItem(item) }}
                    >
                      <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        <span style={{ fontWeight: 600 }}>{item.kepala_keluarga}</span>
                      </Tooltip>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <div className="land-filters" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                <Search size={18} />
              </span>
              <input
                type="text"
                className="input-modern"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedItem(null);
                }}
                placeholder="Cari No KK, Nama, Alamat, atau Desa..."
                style={{ paddingLeft: "40px", width: "100%" }}
              />
            </div>

            <select 
              className="input-modern"
              value={selectedDesa}
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setSelectedItem(null);
              }}
              style={{ maxWidth: "200px" }}
            >
              <option value="">Semua Desa</option>
              {villages.map(desa => (
                <option key={desa} value={desa}>{desa}</option>
              ))}
            </select>
          </div>

          <div className="selection-panel" ref={detailsRef}>
            {selectedItem ? (
              <div className="location-card">
                <div className="card-top-accent"></div>
                <div className="card-body">
                  <div className="card-main-info">
                    <div className="person-identity">
                      <div className="identity-text">
                        <h3>{selectedItem.kepala_keluarga}</h3>
                        <p>Kepala Keluarga</p>
                      </div>
                    </div>
                    <button className="close-selection-btn" onClick={() => setSelectedItem(null)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="details-grid">
                    <div className="info-column">
                      <div className="info-block" style={{ marginBottom: "1rem" }}>
                        <label>Nomor Kartu Keluarga</label>
                        <div className="content" style={{ fontSize: "1.1rem", color: "#1e293b", letterSpacing: "1px", fontWeight: "600" }}>
                          {selectedItem.nomor_kk}
                        </div>
                      </div>
                      <div className="info-block">
                        <label>Alamat Domisili</label>
                        <div className="content" style={{ fontSize: "1.0rem", fontWeight: "600", color: "#1e293b" }}>{selectedItem.alamat || selectedItem.alamat_kk || "-"}</div>
                      </div>
                    </div>
                    <div className="info-column">
                      <div className="info-block" style={{ marginBottom: "1rem" }}>
                        <label>Koordinat Lokasi</label>
                        <div className="content">
                          <span className="coords-badge" style={{ padding: "4px 12px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                            {parseFloat(selectedItem.latitude || selectedItem.lat).toFixed(6)}, 
                            {parseFloat(selectedItem.longitude || selectedItem.lng).toFixed(6)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="info-block">
                          <label>Desa</label>
                          <div className="content">{selectedItem.desa || "-"}</div>
                        </div>
                        <div className="info-block">
                          <label>Kecamatan</label>
                          <div className="content">{selectedItem.kecamatan || "-"}</div>
                        </div>
                      </div>
                    </div>
                    <div className="photo-column">
                      <label style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                        Foto Rumah
                      </label>
                      <div className="photo-frame">
                        {selectedItem.foto_rumah ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL || "http://192.168.0.253:5000/api"}/land/foto/${selectedItem.foto_rumah}`} 
                            alt="Foto Rumah" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setPreviewImage(`${import.meta.env.VITE_API_URL || "http://192.168.0.253:5000/api"}/land/foto/${selectedItem.foto_rumah}`)}
                          />
                        ) : (
                          <div className="no-photo-placeholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            <span>Belum ada foto</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "20px", border: "1px dashed #cbd5e1", color: "#94a3b8" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.5 }}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                <p>Silakan klik salah satu titik lokasi di peta untuk melihat detail data warga.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Full Screen Image Preview Modal */}
      {previewImage && (
        <div 
          className="modal-backdrop" 
          onClick={() => setPreviewImage(null)}
          style={{ 
            zIndex: 4000, 
            background: 'rgba(0,0,0,0.9)', 
            cursor: 'zoom-out' 
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewImage} 
              alt="Preview Full" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                objectFit: 'contain'
              }} 
            />
            <button 
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLand;
