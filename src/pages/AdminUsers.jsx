import React, { useEffect, useState } from 'react';
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
  Avatar, 
  Chip, 
  Select, 
  MenuItem, 
  IconButton, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { ShieldCheck, Plus } from 'lucide-react';
import { adminAPI } from '../services/api';
import './AdminTables.css';
import './AdminPage.css';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
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

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super Admin', icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { value: 'admin', label: 'Admin', icon: <SupervisedUserCircleIcon fontSize="small" /> },
  { value: 'user', label: 'User', icon: <PersonIcon fontSize="small" /> },
];

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  const [submitting, setSubmitting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers();
      setUsers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await adminAPI.createUser(formData);
      setMessage('User berhasil dibuat!');
      setFormData({ username: '', email: '', password: '', role: 'user' });
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus User ini? SEMUA DATA milik user ini akan hilang permanen!')) return;
    try {
      await adminAPI.deleteUser(id);
      setMessage('User berhasil dihapus.');
      loadUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRoleChange = async (id, role) => {
    setUpdatingRole((prev) => ({ ...prev, [id]: true }));
    try {
      await adminAPI.updateUserRole(id, role);
      setMessage('Hak akses user diperbarui.');
      loadUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingRole((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: null, username: '', newPassword: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const openPasswordModal = (user) => {
    setPasswordData({ id: user.id, username: user.username, newPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      alert('Password minimal 6 karakter');
      return;
    }
    setUpdatingPassword(true);
    try {
      await adminAPI.updateUserPassword(passwordData.id, passwordData.newPassword);
      setMessage(`Password untuk ${passwordData.username} berhasil diubah.`);
      setShowPasswordModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPassword(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const isCurrentUser = (id) => currentUser && currentUser.id === id;

  const getRoleChipColor = (role) => {
    switch (role) {
      case 'superadmin': return 'primary';
      case 'admin': return 'success';
      case 'user': return 'info';
      default: return 'default';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="admin-page">
        <div className="admin-header">
          <div className="header-title-section">
            <h2><ShieldCheck size={32} /> Manajemen Pengguna</h2>
            <p className="header-subtitle">
              Kelola hak akses, monitoring autentikasi, dan pengaturan keamanan akun penduduk maupun perangkat desa.
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-add-data"
              onClick={() => setShowModal(true)}
            >
              + Tambah Pengguna Baru
            </button>
          </div>
        </div>

        {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <CircularProgress size={40} sx={{ color: '#10b981' }} />
              <Typography sx={{ mt: 2, color: '#64748b' }}>Memuat data user...</Typography>
            </Box>
          ) : (
            <Table className="modern-table">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>User & Info</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Role Saat Ini</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ubah Akses</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>Tidak ada data user.</TableCell></TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#fcfcfc' }, bgcolor: isCurrentUser(user.id) ? '#f0f9ff' : 'inherit' }}>
                      <TableCell sx={{ color: '#64748b', fontWeight: 500 }}>{index + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {user.username}
                              {isCurrentUser(user.id) && <Chip label="Anda" size="small" color="primary" sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>{user.email || 'Email tidak diset'}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={(user.role || 'user').toUpperCase()} size="small" color={getRoleChipColor(user.role)} variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FormControl size="small" fullWidth sx={{ maxWidth: 200 }}>
                            <Select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={isCurrentUser(user.id) || updatingRole[user.id]} sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                              {ROLE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{opt.icon} {opt.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {updatingRole[user.id] && <CircularProgress size={16} />}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Tooltip title="Ubah Password"><IconButton onClick={() => openPasswordModal(user)} color="warning" size="small" sx={{ bgcolor: '#fffbeb', '&:hover': { bgcolor: '#fef3c7' } }}><KeyIcon fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Hapus User"><IconButton onClick={() => handleDelete(user.id)} disabled={isCurrentUser(user.id)} color="error" size="small" sx={{ bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' } }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header modal-header-green">
                <h3>Buat Akun Baru</h3>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleCreate}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField label="Username" name="username" type="text" fullWidth size="small" value={formData.username} onChange={handleChange} required />
                    <TextField label="Email (Opsional)" name="email" type="email" fullWidth size="small" value={formData.email} onChange={handleChange} />
                    <TextField label="Password" name="password" type="password" fullWidth size="small" value={formData.password} onChange={handleChange} required error={formData.password.length > 0 && formData.password.length < 6} helperText={formData.password.length > 0 && formData.password.length < 6 ? "Minimal 6 karakter" : ""} />
                    <FormControl fullWidth size="small"><InputLabel>Role</InputLabel><Select name="role" value={formData.role} onChange={handleChange} label="Role">{ROLE_OPTIONS.map((opt) => (<MenuItem key={opt.value} value={opt.value}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{opt.icon}{opt.label}</Box></MenuItem>))}</Select></FormControl>
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                      <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>BATAL</button>
                      <button type="submit" className="btn-green-premium" disabled={submitting} style={{ flex: 2, justifyContent: 'center' }}>{submitting ? 'Menyimpan...' : 'SIMPAN USER →'}</button>
                    </Box>
                  </Box>
                </form>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header modal-header-green"><h3>Ubah Password User</h3><button className="btn-close btn-close-white" onClick={() => setShowPasswordModal(false)}>×</button></div>
              <div className="modal-body">
                <form onSubmit={handlePasswordUpdate}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField label="Username" type="text" fullWidth size="small" value={passwordData.username} disabled sx={{ bgcolor: '#f8fafc' }} />
                    <TextField label="Password Baru *" type="password" fullWidth size="small" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required autoFocus error={passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6} helperText={passwordData.newPassword.length > 0 && passwordData.newPassword.length < 6 ? "Minimal 6 karakter" : ""} />
                    <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                      <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, justifyContent: 'center' }}>BATAL</button>
                      <button type="submit" className="btn-green-premium" disabled={updatingPassword} style={{ flex: 2, justifyContent: 'center' }}>{updatingPassword ? 'Menyimpan...' : 'SIMPAN PASSWORD →'}</button>
                    </Box>
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
