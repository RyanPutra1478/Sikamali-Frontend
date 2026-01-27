import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { fetchWithAuth } from '../services/api';

const DataZona = () => {
  const [zonaData, setZonaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [zonaForm, setZonaForm] = useState({
    nama_zona: '',
    kode_zona: '',
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setZonaForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/locations/zona/${editingId}` : '/locations/zona';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(zonaForm),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan data');
      }

      fetchZonaData();
      handleCloseDialog();
      alert(`Data zona berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`);
    } catch (error) {
      console.error('Error saving zona:', error);
      alert(`Gagal menyimpan data zona: ${error.message}`);
    }
  };

  // Handle edit button click
  const handleEdit = (zona) => {
    setEditingId(zona.id);
    setZonaForm({
      nama_zona: zona.nama_zona || '',
      kode_zona: zona.kode_zona || '',
      keterangan: zona.keterangan || '',
      status: zona.status || 'active',
      koordinat: zona.koordinat || ''
    });
    setOpenDialog(true);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data zona ini?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/locations/zona/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus data');
      }

      fetchZonaData();
      alert('Data zona berhasil dihapus');
    } catch (error) {
      console.error('Error deleting zona:', error);
      alert(`Gagal menghapus data zona: ${error.message}`);
    }
  };

  // Handle dialog open/close
  const handleOpenDialog = () => {
    setEditingId(null);
    setZonaForm({
      nama_zona: '',
      kode_zona: '',
      keterangan: '',
      status: 'active',
      koordinat: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Filter data based on search term and status
  const filteredData = zonaData.filter(zona => {
    const matchesSearch =
      (zona.nama_zona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zona.kode_zona?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zona.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      !searchTerm;

    const matchesStatus = filterStatus === 'all' || zona.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography component="h2" variant="h6" color="primary" gutterBottom>
                  Data Zona
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                >
                  Tambah Zona
                </Button>
              </Box>

              {/* Search and Filter */}
              <Box display="flex" gap={2} mb={3}>
                <TextField
                  size="small"
                  placeholder="Cari zona..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                  }}
                  sx={{ width: 300 }}
                />
                <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">Semua Status</MenuItem>
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Tidak Aktif</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Data Table */}
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama Zona</TableCell>
                      <TableCell>Kode Zona</TableCell>
                      <TableCell>Keterangan</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((zona) => (
                        <TableRow key={zona.id}>
                          <TableCell>{zona.nama_zona}</TableCell>
                          <TableCell>{zona.kode_zona}</TableCell>
                          <TableCell>{zona.keterangan}</TableCell>
                          <TableCell>
                            <Box
                              component="span"
                              sx={{
                                p: '4px 8px',
                                borderRadius: 1,
                                bgcolor: zona.status === 'active' ? 'success.light' : 'error.light',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'medium'
                              }}
                            >
                              {zona.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(zona)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(zona.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Edit Zona' : 'Tambah Zona Baru'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nama Zona"
                  name="nama_zona"
                  value={zonaForm.nama_zona}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kode Zona"
                  name="kode_zona"
                  value={zonaForm.kode_zona}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={zonaForm.status}
                    onChange={handleInputChange}
                    label="Status"
                    required
                  >
                    <MenuItem value="active">Aktif</MenuItem>
                    <MenuItem value="inactive">Tidak Aktif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Keterangan"
                  name="keterangan"
                  value={zonaForm.keterangan}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Koordinat"
                  name="koordinat"
                  value={zonaForm.koordinat}
                  onChange={handleInputChange}
                  placeholder="Contoh: -7.250445, 112.768845"
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Batal</Button>
            <Button type="submit" variant="contained" color="primary">
              Simpan
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container >
  );
};

export default DataZona;