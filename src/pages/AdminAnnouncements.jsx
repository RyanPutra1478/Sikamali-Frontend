import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Tooltip, 
  Chip, 
  CircularProgress,
  TextField,
  ThemeProvider,
  createTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CampaignIcon from '@mui/icons-material/Campaign';
import { Megaphone, Plus } from 'lucide-react';
import { announcementAPI } from '../services/api';
import './AdminTables.css';
import './AdminPage.css';

const theme = createTheme({
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default function AdminAnnouncements({ readOnly }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await announcementAPI.get();
      setList(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await announcementAPI.create(form);
      setForm({ title: '', content: '' });
      setShowModal(false);
      loadData();
    } catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Hapus pengumuman ini secara permanen?')) return;
    try {
      await announcementAPI.delete(id);
      loadData();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  const handleToggle = async (id) => {
    try {
      await announcementAPI.toggle(id);
      loadData();
    } catch (err) { alert('Gagal mengubah status: ' + err.message); }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="admin-page">
        <div className="admin-header">
          <div className="header-title-section">
            <div className="section-badge">Komunikasi Publik</div>
            <h2><Megaphone size={32} /> Pengumuman Desa</h2>
            <p className="header-subtitle">
              Sampaikan informasi penting, jadwal kegiatan, dan berita terkini kepada seluruh elemen warga lingkar tambang.
            </p>
          </div>
          <div className="header-actions">
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<Plus size={20} />}
                onClick={() => setShowModal(true)}
                sx={{
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                  borderRadius: '8px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Buat Pengumuman
              </Button>
            )}
          </div>
        </div>

        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={40} sx={{ color: '#10b981' }} />
              <Typography sx={{ color: '#64748b' }}>Memuat data pengumuman...</Typography>
            </Box>
          ) : list.length === 0 ? (
            <Box sx={{ p: 10, textAlign: 'center' }}>
              <CampaignIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum ada pengumuman yang diterbitkan.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', py: 2 }}>Tanggal</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', py: 2 }}>Judul</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', py: 2 }}>Isi Ringkasan</TableCell>
                  <TableCell sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', py: 2 }}>Status</TableCell>
                  {!readOnly && <TableCell align="center" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b', py: 2 }}>Aksi</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((item) => (
                  <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#f1f5f9' }, transition: 'background-color 0.2s' }}>
                    <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{item.title}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Oleh: {item.author_name || 'Admin'}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 300 }}>
                      {item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content}
                    </TableCell>
                    <TableCell>
                      <Chip label={item.is_active ? 'TAYANG' : 'DRAFT'} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: item.is_active ? '#d1fae5' : '#f1f5f9', color: item.is_active ? '#065f46' : '#64748b', border: item.is_active ? '1px solid #86efac' : '1px solid #e2e8f0', borderRadius: '6px' }} />
                    </TableCell>
                    {!readOnly && (
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title={item.is_active ? "Sembunyikan" : "Tampilkan"}>
                            <IconButton onClick={() => handleToggle(item.id)} size="small" sx={{ bgcolor: item.is_active ? '#f1f5f9' : '#ecfdf5', color: item.is_active ? '#64748b' : '#10b981' }}>
                              {item.is_active ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Hapus"><IconButton onClick={() => handleDelete(item.id)} size="small" sx={{ bgcolor: '#fef2f2', color: '#ef4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              <div className="modal-header modal-header-green">
                <h3>Buat Pengumuman Baru</h3>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField label="Judul Utama" fullWidth variant="outlined" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    <TextField label="Isi Informasi" fullWidth variant="outlined" multiline rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                    <Box sx={{ mt: 1 }}><button type="submit" className="btn-green-premium" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>{submitting ? 'MENERBITKAN...' : 'TERBITKAN INFO →'}</button></Box>
                  </Box>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}