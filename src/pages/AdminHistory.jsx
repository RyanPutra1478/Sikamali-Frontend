import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/api';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { History, Search } from 'lucide-react';
import './AdminTables.css';
import './AdminPage.css';

export default function AdminHistory() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const limit = 10;
    const [search, setSearch] = useState('');

    const [selectedLog, setSelectedLog] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/logs`, {
                params: {
                    limit: limit,
                    offset: page * limit,
                    search: search
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(response.data.data);
            setTotalPages(Math.ceil(response.data.pagination.total / limit));
        } catch (err) {
            console.error("Gagal memuat logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [page, search]);

    const handleViewDetail = (log) => {
        setSelectedLog(log);
        setDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setDetailOpen(false);
        setSelectedLog(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getBadgeStyle = (action) => {
        switch (action) {
            case 'CREATE': return { background: '#d1fae5', color: '#065f46' };
            case 'UPDATE': return { background: '#fff7ed', color: '#c2410c' };
            case 'DELETE': return { background: '#fee2e2', color: '#991b1b' };
            default: return { background: '#f3f4f6', color: '#374151' };
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div className="header-title-section">
                    <div className="section-badge">Sistem Keamanan</div>
                    <h2><History size={32} /> Log Aktivitas</h2>
                    <p className="header-subtitle">
                        Pantau seluruh rekaman perubahan data, aktivitas autentikasi, dan audit sistem untuk menjaga integritas data.
                    </p>
                </div>
                <div className="header-actions">
                    <div className="search-box" style={{ width: '300px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Cari User atau Aksi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-modern"
                            style={{ width: '100%', paddingLeft: '40px' }}
                        />
                    </div>
                    <button className="btn-secondary" onClick={fetchLogs} style={{ height: '42px', width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <RefreshIcon fontSize="small" />
                    </button>
                </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: '2rem' }}>
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Memuat data...</p>
                ) : logs.length === 0 ? (
                    <p style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Tidak ada aktivitas ditemukan.</p>
                ) : (
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th width="20%">Waktu</th>
                                <th width="20%">User</th>
                                <th width="15%">Aksi</th>
                                <th width="35%">Entitas</th>
                                <th width="10%">Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td>
                                        <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                            {log.user_name || `ID: ${log.user_id}`}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="role-badge" style={getBadgeStyle(log.action)}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ color: '#4b5563' }}>
                                        {log.entity}
                                    </td>
                                    <td>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleViewDetail(log)}
                                            title="Lihat Detail"
                                            style={{ color: '#3b82f6', background: '#eff6ff' }}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                <button
                    className="btn-secondary"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                    Previous
                </button>
                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Halaman {page + 1} dari {totalPages || 1}</span>
                <button
                    className="btn-secondary"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                    Next
                </button>
            </div>

            {/* DETAIL DIALOG */}
            <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
                <DialogTitle style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
                    <Typography variant="h6" style={{ fontWeight: 'bold' }}>Detail Log Aktivitas</Typography>
                </DialogTitle>
                <DialogContent style={{ padding: '24px' }}>
                    {selectedLog && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="detail-item">
                                    <label>Waktu</label>
                                    <div className="detail-value">{formatDate(selectedLog.created_at)}</div>
                                </div>
                                <div className="detail-item">
                                    <label>User</label>
                                    <div className="detail-value">{selectedLog.user_name}</div>
                                </div>
                                <div className="detail-item">
                                    <label>Aksi</label>
                                    <div className="detail-value">
                                        <span className="role-badge" style={getBadgeStyle(selectedLog.action)}>
                                            {selectedLog.action}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <label>Entitas</label>
                                    <div className="detail-value">{selectedLog.entity}</div>
                                </div>
                            </div>

                            <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: '8px', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                Data Perubahan (JSON)
                            </Typography>
                            <div style={{
                                background: '#f9fafb',
                                padding: '16px',
                                borderRadius: '8px',
                                overflowX: 'auto',
                                border: '1px solid #e5e7eb',
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '0.85rem',
                                color: '#374151'
                            }}>
                                <pre style={{ margin: 0 }}>
                                    {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </DialogContent>
                <DialogActions style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px' }}>
                    <Button onClick={handleCloseDetail} variant="contained" style={{ background: '#3b82f6', textTransform: 'none' }}>
                        Tutup
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
