import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  Grid,
  Card,
  IconButton,
  Tooltip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  alpha,
  InputLabel,
  Menu,
  Button
} from '@mui/material';
import { Search as SearchIcon, Home as HomeIcon, VerifiedUser as VerifiedUserIcon, People as PeopleIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { Home, Download as FileDownloadIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { adminAPI, previewAPI } from '../services/api';
import * as XLSX from 'xlsx';
import './AdminTables.css';
import './AdminPage.css';

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon, color }) => (
  <Card
    sx={{
      height: '110px',
      display: 'flex',
      alignItems: 'center',
      px: 3,
      borderRadius: '24px',
      border: '1px solid #f1f5f9',
      bgcolor: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 20px -5px ${alpha(color, 0.1)}`,
      }
    }}
  >
    {/* Decorative Glow (Top Right) */}
    <Box
      sx={{
        position: 'absolute',
        top: -15,
        right: -15,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle at center, ${alpha(color, 0.1)} 0%, transparent 70%)`,
        zIndex: 0
      }}
    />

    <Box
      sx={{
        width: 68,
        height: 68,
        borderRadius: '18px',
        bgcolor: alpha(color, 0.08),
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2.5,
        zIndex: 1,
        border: `1px solid ${alpha(color, 0.1)}`
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 32 } })}
    </Box>

    <Box sx={{ zIndex: 1 }}>
      <Typography 
        variant="caption" 
        sx={{ 
          color: '#64748b', 
          fontWeight: 700, 
          display: 'block', 
          mb: 0.5,
          fontSize: '0.75rem'
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 850, 
            color: '#0f172a', 
            fontSize: '1.75rem',
            lineHeight: 1 
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#94a3b8', 
            fontWeight: 600, 
            fontSize: '0.75rem' 
          }}
        >
          Orang
        </Typography>
      </Box>
    </Box>
  </Card>
);

const DataPreviewKeluarga = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await previewAPI.getKK();
      setData(Array.isArray(res) ? res : res?.data || []);
    } catch (error) {
      console.error("Error fetching KK data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = (exportAll = false) => {
    setExportMenuAnchor(null);
    const sourceData = exportAll ? data : filteredData;
    const exportData = sourceData.map((row, index) => {
      const isPrasejahtera = row.kategori_sosial?.toLowerCase() === 'prasejahtera';
      return {
        'No': index + 1,
        'NO KARTU KELUARGA': row.nomor_kk,
        'Kepala Keluarga': row.kepala_keluarga,
        'Alamat': row.alamat,
        'Desa': row.desa_kelurahan,
        'Kecamatan': row.kecamatan,
        'Zona': row.zona_lingkar,
        'Koordinat': `${row.koordinat_latitude || '-'}, ${row.koordinat_longitude || '-'}`,
        'Jumlah Anggota': row.anggota_keluarga,
        'Angkatan Kerja': row.angkatan_kerja,
        'Sudah Bekerja': row.sudah_bekerja,
        'Belum Bekerja': row.belum_bekerja,
        'Kategori Sosial': row.kategori_sosial?.toUpperCase() || (isPrasejahtera ? 'PRASEJAHTERA' : 'SEJAHTERA'),
        'Tingkat Sosial': row.tingkat_sosial || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Keluarga");
    
    // Set column widths
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 10},
      {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 20}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Data_Keluarga_Sikamali_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isPra = (item) => {
    return item.kategori_sosial?.toLowerCase() === 'prasejahtera';
  };

  const uniqueDesa = [...new Set(data.map(item => item.desa_kelurahan).filter(Boolean))].sort();

  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item.kepala_keluarga || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nomor_kk || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alamat || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterValue === 'sejahtera' && isPra(item)) return false;
    if (filterValue === 'prasejahtera' && !isPra(item)) return false;

    if (selectedDesa && item.desa_kelurahan !== selectedDesa) return false;
    
    return true;
  });

  const stats = {
    total: data.length,
    sejahtera: data.filter(d => !isPra(d)).length,
    praSejahtera: data.filter(d => isPra(d)).length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 5, mb: 10 }}>
      <div className="admin-header" style={{ marginBottom: '3rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
        <div className="header-title-section">
          <div className="section-badge">Statistik Kependudukan</div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Home size={32} /> Data Preview Keluarga
          </h2>
          <p className="header-subtitle" style={{ fontSize: '1.1rem', color: '#64748b', marginTop: '8px' }}>
            Ringkasan data Kartu Keluarga dan statistik kesejahteraan desa lingkar tambang.
          </p>
        </div>
        <div className="header-actions">
           <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.5 }}>
              <RefreshIcon size={24} color="#10b981" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Excel">
            <IconButton 
              onClick={(e) => setExportMenuAnchor(e.currentTarget)} 
              sx={{ bgcolor: '#ecfdf5', color: '#10b981', border: '1px solid #d1fae5', p: 1.5 }}
            >
              <FileDownloadIcon size={24} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={exportMenuAnchor}
            open={openExportMenu}
            onClose={() => setExportMenuAnchor(null)}
            PaperProps={{
              sx: {
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                borderRadius: 3,
                mt: 1,
                border: '1px solid #e2e8f0'
              }
            }}
          >
            <MenuItem onClick={() => handleExportExcel(false)} sx={{ fontWeight: 600, color: '#1e293b', gap: 1 }}>
              <FileDownloadIcon size={18} /> Export Data Terfilter ({filteredData.length})
            </MenuItem>
            <MenuItem onClick={() => handleExportExcel(true)} sx={{ fontWeight: 600, color: '#10b981', gap: 1 }}>
              <PeopleIcon size={18} /> Export Semua Data ({data.length})
            </MenuItem>
          </Menu>
        </div>
      </div>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <StatCard title="Total Kepala Keluarga" value={stats.total} icon={<HomeIcon />} color="#10b981" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Keluarga Sejahtera" value={stats.sejahtera} icon={<VerifiedUserIcon />} color="#3b82f6" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard title="Keluarga Prasejahtera" value={stats.praSejahtera} icon={<PeopleIcon />} color="#f43f5e" />
        </Grid>
      </Grid>

      {/* MAIN TABLE PAPER */}
      <Paper elevation={0} sx={{ borderRadius: 5, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
        <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fcfcfc', borderBottom: '1px solid #f1f5f9' }}>
          <TextField
            size="small"
            placeholder="Cari No KK, Kepala Keluarga, dsb..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: 'white',
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filterValue}
              label="Filter Status"
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: 'white',
              }}
            >
              <MenuItem value=""><em>Semua Status</em></MenuItem>
              <MenuItem value="sejahtera">Sejahtera</MenuItem>
              <MenuItem value="prasejahtera">Prasejahtera</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter Desa</InputLabel>
            <Select
              value={selectedDesa}
              label="Filter Desa"
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setPage(1);
              }}
              sx={{ 
                borderRadius: 2.5, 
                bgcolor: 'white',
              }}
            >
              <MenuItem value=""><em>Semua Desa</em></MenuItem>
              {uniqueDesa.map(desa => (
                <MenuItem key={desa} value={desa}>{desa}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <FilterListIcon />
          </IconButton>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ minWidth: 1800 }}>
            <thead>
              <tr>
                {[
                  'NO', 'NO KARTU KELUARGA', 'KEPALA KELUARGA', 'ALAMAT', 'DESA', 'KECAMATAN',
                  'ZONA LINGKAR TAMBANG', 'KOORDINAT', 'JUMLAH ANGGOTA', 'ANGKATAN KERJA', 'BEKERJA', 'BELUM BEKERJA', 'KATEGORI SOSIAL', 'TINGKAT SOSIAL'
                ].map((head) => (
                  <th key={head}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <CircularProgress sx={{ color: '#10b981' }} />
                  </td>
                </tr>
              ) : (
                filteredData.slice((page-1)*itemsPerPage, page*itemsPerPage).map((row, index) => {
                  const isPrasejahtera = row.kategori_sosial?.toLowerCase() === 'prasejahtera';
                  return (
                    <tr key={index}>
                      <td style={{ textAlign: 'center' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                      <td style={{ fontWeight: 800, color: '#1e293b' }}>{row.nomor_kk}</td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>{row.kepala_keluarga}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.alamat}>{row.alamat}</td>
                      <td>{row.desa_kelurahan}</td>
                      <td>{row.kecamatan}</td>
                      <td>
                        <span className={`status-badge-lg ${row.zona_lingkar?.toLowerCase() === 'ring 1' ? 'status-danger' : 'status-success'}`} style={{ fontSize: '0.7rem' }}>
                          {row.zona_lingkar || '-'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.koordinat_latitude && row.koordinat_longitude ? `${row.koordinat_latitude}, ${row.koordinat_longitude}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>{row.anggota_keluarga}</td>
                      <td style={{ textAlign: 'center' }}>{row.angkatan_kerja}</td>
                      <td style={{ textAlign: 'center', color: (row.sudah_bekerja > 0 ? '#10b981' : 'inherit') }}>{row.sudah_bekerja}</td>
                      <td style={{ textAlign: 'center', color: (row.belum_bekerja > 0 ? '#f43f5e' : 'inherit') }}>{row.belum_bekerja}</td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase',
                          color: (row.kategori_sosial?.toLowerCase() === 'sejahtera mandiri' ? '#3b82f6' : 
                                 (row.kategori_sosial?.toLowerCase() === 'prasejahtera' || isPrasejahtera) ? '#ef4444' : '#10b981')
                        }}>
                          {row.kategori_sosial || (isPrasejahtera ? 'PRASEJAHTERA' : 'SEJAHTERA')}
                        </span>
                      </td>
                      <td>
                        {row.tingkat_sosial ? (
                          <span className={`status-badge-lg ${
                            row.tingkat_sosial.toLowerCase().includes('ekstrem') ? 'status-danger' : 
                            row.tingkat_sosial.toLowerCase().includes('miskin') ? 'status-moved' : 'status-newcomer'
                          }`} style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {row.tingkat_sosial}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(filteredData.length / itemsPerPage)} 
            page={page} 
            onChange={(e,v) => setPage(v)} 
            sx={{ '& .Mui-selected': { bgcolor: '#10b981 !important', color: 'white' } }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default DataPreviewKeluarga;
