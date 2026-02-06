// DataPenduduk.jsx
import React, { useState, useEffect } from 'react';
import { userServiceAPI } from '../services/api';
import { DataGrid } from '@mui/x-data-grid';
import { Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, FormControl, InputLabel, Select, Snackbar, Alert } from '@mui/material';
import { format } from 'date-fns';
import id from 'date-fns/locale/id';

const DataPenduduk = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    jenis_kelamin: '',
    hubungan_keluarga: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: '',
    pendidikan: '',
    pekerjaan: '',
    status_perkawinan: '',
    nama_ayah: '',
    nama_ibu: '',
    status_domisili: '',
    alamat: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { field: 'nik', headerName: 'NIK', width: 180 },
    { field: 'nama', headerName: 'Nama', width: 200 },
    { 
      field: 'jenis_kelamin', 
      headerName: 'Jenis Kelamin', 
      width: 150,
      valueGetter: (params) => params.row.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'
    },
    { field: 'tempat_lahir', headerName: 'Tempat Lahir', width: 150 },
    { 
      field: 'tanggal_lahir', 
      headerName: 'Tanggal Lahir', 
      width: 150,
      valueGetter: (params) => 
        params.row.tanggal_lahir 
          ? format(new Date(params.row.tanggal_lahir), 'dd MMMM yyyy', { locale: id }) 
          : '-'
    },
    { field: 'agama', headerName: 'Agama', width: 100 },
    { field: 'pendidikan', headerName: 'Pendidikan', width: 120 },
    { field: 'pekerjaan', headerName: 'Pekerjaan', width: 150 },
    { field: 'status_perkawinan', headerName: 'Status Nikah', width: 130 },
    { field: 'nama_ayah', headerName: 'Nama Ayah', width: 150 },
    { field: 'nama_ibu', headerName: 'Nama Ibu', width: 150 },
    { 
      field: 'status_domisili', 
      headerName: 'Domisili', 
      width: 130,
      renderCell: (params) => {
          const s = (params.value || '').toLowerCase();
          let color = '#10b981'; // Green
          let bgcolor = '#f0fdf4';
          
          if (s.includes('meninggal')) { color = '#e11d48'; bgcolor = '#fff1f2'; }
          else if (s.includes('pindah')) { color = '#c2410c'; bgcolor = '#fff7ed'; }
          else if (s.includes('pendatang')) { color = '#1d4ed8'; bgcolor = '#eff6ff'; }
          
          return (
            <span style={{ 
              backgroundColor: bgcolor, 
              color: color, 
              padding: '2px 8px', 
              borderRadius: '99px', 
              fontSize: '0.7rem', 
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {params.value}
            </span>
          );
      }
    },
    { field: 'status_data', headerName: 'Status Kependudukan', width: 120 },
    { field: 'alamat', headerName: 'Alamat', width: 250 },
    {
      field: 'actions',
      headerName: 'Aksi',
      width: 150,
      renderCell: (params) => (
        <div>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => handleOpenDialog(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await userServiceAPI.getPendudukList();
      setData(Array.isArray(response) ? response : []);
    } catch (err) {
      setError('Gagal memuat data penduduk');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        nik: item.nik || '',
        nama: item.nama || '',
        jenis_kelamin: item.jenis_kelamin || '',
        hubungan_keluarga: item.hubungan_keluarga || '',
        tempat_lahir: item.tempat_lahir || '',
        tanggal_lahir: item.tanggal_lahir ? format(new Date(item.tanggal_lahir), 'yyyy-MM-dd') : '',
        agama: item.agama || '',
        pendidikan: item.pendidikan || '',
        pekerjaan: item.pekerjaan || '',
        status_perkawinan: item.status_perkawinan || '',
        nama_ayah: item.nama_ayah || '',
        nama_ibu: item.nama_ibu || '',
        status_domisili: item.status_domisili || '',
        alamat: item.alamat || '',
      });
    } else {
      setSelectedItem(null);
      setFormData({
        nik: '',
        nama: '',
        jenis_kelamin: '',
        hubungan_keluarga: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: '',
        pendidikan: '',
        pekerjaan: '',
        status_perkawinan: '',
        nama_ayah: '',
        nama_ibu: '',
        status_domisili: '',
        alamat: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
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
    try {
      setLoading(true);
      if (selectedItem) {
        // Update existing
        await userServiceAPI.updatePenduduk(selectedItem.id, formData);
        setSnackbar({ open: true, message: 'Data berhasil diperbarui', severity: 'success' });
      } else {
        // Create new
        await userServiceAPI.createPenduduk(formData);
        setSnackbar({ open: true, message: 'Data berhasil ditambahkan', severity: 'success' });
      }
      fetchData();
      handleCloseDialog();
    } catch (err) {
      console.error('Error:', err);
      setSnackbar({ 
        open: true, 
        message: `Gagal ${selectedItem ? 'memperbarui' : 'menambahkan'} data: ${err.message || 'Terjadi kesalahan'}`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        setLoading(true);
        await userServiceAPI.deletePenduduk(id);
        setSnackbar({ open: true, message: 'Data berhasil dihapus', severity: 'success' });
        fetchData();
      } catch (err) {
        console.error('Error:', err);
        setSnackbar({ 
          open: true, 
          message: 'Gagal menghapus data', 
          severity: 'error' 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>Data Penduduk</h2>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleOpenDialog()}
        >
          Tambah Data
        </Button>
      </div>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
        />
      </div>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <TextField
                name="nik"
                label="NIK"
                value={formData.nik}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                name="nama"
                label="Nama Lengkap"
                value={formData.nama}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Jenis Kelamin</InputLabel>
                <Select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="L">Laki-laki</MenuItem>
                  <MenuItem value="P">Perempuan</MenuItem>
                </Select>
              </FormControl>
              <TextField
                name="hubungan_keluarga"
                label="Hubungan Keluarga"
                value={formData.hubungan_keluarga}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                name="tempat_lahir"
                label="Tempat Lahir"
                value={formData.tempat_lahir}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
              />
              <TextField
                name="tanggal_lahir"
                label="Tanggal Lahir"
                type="date"
                value={formData.tanggal_lahir}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                name="agama"
                label="Agama"
                value={formData.agama}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="pendidikan"
                label="Pendidikan"
                value={formData.pendidikan}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="pekerjaan"
                label="Pekerjaan"
                value={formData.pekerjaan}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="status_perkawinan"
                label="Status Perkawinan"
                value={formData.status_perkawinan}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="nama_ayah"
                label="Nama Ayah"
                value={formData.nama_ayah}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="nama_ibu"
                label="Nama Ibu"
                value={formData.nama_ibu}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="status_domisili"
                label="Status Domisili"
                value={formData.status_domisili}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="alamat"
                label="Alamat Detail"
                value={formData.alamat}
                onChange={handleInputChange}
                required
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" color="primary" variant="contained" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DataPenduduk;