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
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
  Button
} from '@mui/material';
import { Search as SearchIcon, People as PeopleIcon, Man as ManIcon, Woman as WomanIcon } from '@mui/icons-material';
import { Users, Download as FileDownloadIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { previewAPI } from '../services/api';
import { getRolePermissions } from '../utils/permissions';
import * as XLSX from 'xlsx';
import './AdminTables.css';
import './AdminPage.css';

// --- STAT CARD COMPONENT ---
const StatCard = ({ title, value, icon, color, unit = "Orang" }) => (
  <Card
    sx={{
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      px: 2,
      borderRadius: '16px',
      border: '1px solid #f1f5f9',
      bgcolor: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 15px -5px ${alpha(color, 0.1)}`,
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
        width: 48,
        height: 48,
        borderRadius: '12px',
        bgcolor: alpha(color, 0.08),
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2,
        zIndex: 1,
        border: `1px solid ${alpha(color, 0.1)}`
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: 24 } })}
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
            fontSize: '1.4rem',
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
          {unit}
        </Typography>
      </Box>
    </Box>
  </Card>
);

const DataPreviewPenduduk = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesa, setSelectedDesa] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const openExportMenu = Boolean(exportMenuAnchor);

  const role = user?.role || 'user';
  const perms = getRolePermissions(role);
  const canExport = perms?.dataPreview?.penduduk?.export;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const residents = await previewAPI.getMember();
      setData(residents);
    } catch (error) {
      console.error("Error fetching resident data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setSelectedDesa('');
    setPage(1);
    fetchData();
  };

  const handleExportExcel = (exportAll = false) => {
    setExportMenuAnchor(null);
    const sourceData = exportAll ? data : filteredData;
    const exportData = sourceData.map((row, index) => ({
      'No': index + 1,
      'NO KARTU KELUARGA': row.no_kartu_keluarga,
      'Kepala Keluarga': row.kepala_keluarga || '-',
      'Alamat': row.alamat,
      'Desa/Kelurahan': row.desa_kelurahan || '-',
      'Kecamatan': row.kecamatan,
      'ZONA': row.zona || '-',
      'Nama Lengkap': row.nama_lengkap,
      'NIK': row.nik,
      'Jenis Kelamin': (row.jenis_kelamin || '').toString().toUpperCase().startsWith('L') ? 'LAKI-LAKI' : 'PEREMPUAN',
      'Umur': row.umur || '-',
      'Pendidikan': row.pendidikan || '-',
      'Pekerjaan': row.pekerjaan || '-',
      'Hubungan Keluarga': row.hubungan_keluarga || '-',
      'Pendidikan Terakhir': row.pendidikan_terakhir || '-',
      'Skill': row.skill || '-',
      'Status Kerja': row.status_kerja || '-',
      'Tempat Bekerja': row.tempat_bekerja || '-',
      'No HP/WA': row.no_hp_wa || '-',
      'Email': row.email || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Penduduk");
    
    // Set column widths for better readability
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 20}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 20},
      {wch: 20}, {wch: 20}, {wch: 15}, {wch: 8}, {wch: 15}, {wch: 15}, {wch: 20},
      {wch: 20}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 25}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Data_Penduduk_Sikamali_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const uniqueDesa = [...new Set(data.map(item => item.desa_kelurahan).filter(Boolean))].sort();

  const filteredData = data.filter(item => {
    const matchesSearch = (item.nama_lengkap || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.nik || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.no_kartu_keluarga || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDesa = !selectedDesa || item.desa_kelurahan === selectedDesa;

    return matchesSearch && matchesDesa;
  });

  const stats = {
    total: data.length,
    laki: data.filter(d => (d.jenis_kelamin || '').toLowerCase().startsWith('l')).length,
    perempuan: data.filter(d => (d.jenis_kelamin || '').toLowerCase().startsWith('p')).length
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box className="admin-header" sx={{ 
        flexDirection: { xs: 'column', md: 'row' }, 
        alignItems: { xs: 'flex-start', md: 'flex-end' },
        gap: { xs: 2, md: 0 },
        mb: '1.5rem', 
        borderBottom: '1px solid #e2e8f0', 
        paddingBottom: '1rem' 
      }}>
        <div className="header-title-section">
          <h2 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} /> Data Preview Penduduk
          </h2>
          <p className="header-subtitle" style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '4px' }}>
            Ringkasan detail kependudukan, demografi desa, dan profil pekerjaan masyarakat.
          </p>
        </div>
        <Box className="header-actions" sx={{ 
          width: { xs: '100%', md: 'auto' }, 
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
          gap: 1.5 
        }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 1.5 }}>
              <RefreshIcon size={24} color="#10b981" />
            </IconButton>
          </Tooltip>
          {canExport && (
            <>
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
                  <Users size={18} /> Export Semua Data ({data.length})
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'nowrap', 
          gap: 2, 
          mb: 3, 
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': { height: '4px' },
          '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: '10px' }
        }}
      >
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Total Penduduk" value={stats.total} icon={<PeopleIcon />} color="#6366f1" />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Laki-laki" value={stats.laki} icon={<ManIcon />} color="#0ea5e9" />
        </Box>
        <Box sx={{ flex: 1, minWidth: '200px' }}>
          <StatCard title="Perempuan" value={stats.perempuan} icon={<WomanIcon />} color="#f43f5e" />
        </Box>
      </Box>

      {/* TABLE PAPER */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' }}>
        <Box sx={{ 
          p: 2, 
          bgcolor: '#fcfcfc', 
          borderBottom: '1px solid #f1f5f9', 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 2, 
          alignItems: 'center' 
        }}>
          <TextField
            size="small"
            placeholder="Cari Nama, NIK, atau No KK..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            sx={{ width: { xs: '100%', sm: 400 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'white' } }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>) }}
          />
          
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { xs: '1 1 auto', sm: '0 0 auto' } }}>
            <InputLabel>Filter Desa</InputLabel>
            <Select
              value={selectedDesa}
              label="Filter Desa"
              onChange={(e) => {
                setSelectedDesa(e.target.value);
                setPage(1);
              }}
              sx={{ borderRadius: 2.5, bgcolor: 'white' }}
            >
              <MenuItem value=""><em>Semua Desa</em></MenuItem>
              {uniqueDesa.map(desa => (
                <MenuItem key={desa} value={desa}>{desa}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <table className="modern-table" style={{ minWidth: 3500 }}>
            <thead>
              <tr>
                {[
                  'NO', 'NO KARTU KELUARGA', 'KEPALA KELUARGA', 'ALAMAT', 'DESA/KELURAHAN', 'KECAMATAN',
                  'ZONA', 'NAMA LENGKAP', 'NIK', 'JENIS KELAMIN', 'UMUR',
                  'PENDIDIKAN', 'PEKERJAAN', 'HUBUNGAN KELUARGA', 'PENDIDIKAN TERAKHIR', 'SKILL',
                  'STATUS KERJA', 'TEMPAT BEKERJA', 'NO HP/WA', 'E-MAIL'
                ].map((head) => {
                  const isCentered = head === 'NO';
                  return (
                    <th key={head} style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '800',
                      textAlign: isCentered ? 'center' : 'left',
                      padding: '8px 12px',
                      paddingLeft: isCentered ? '12px' : head === 'ZONA' ? '12px' : '12px'
                    }}>
                      {head}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={24} style={{ textAlign: 'center', padding: '100px 0' }}><CircularProgress sx={{ color: '#10b981' }} /></td></tr>
              ) : (
                filteredData.slice((page-1)*itemsPerPage, page*itemsPerPage).map((row, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center', fontSize: '0.75rem', padding: '5px 12px' }}>{(page - 1) * itemsPerPage + index + 1}</td>
                    <td style={{ color: '#1e293b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.no_kartu_keluarga}</td>
                    <td style={{ color: '#1e293b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.kepala_keluarga || '-'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', padding: '5px 12px' }}>{row.alamat}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.desa_kelurahan || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.kecamatan}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>
                      <span style={{ 
                        color: (() => {
                          const z = (row.zona || "").toUpperCase();
                          if (z.includes("RING 1")) return "#3b82f6";
                          if (z.includes("RING 2")) return "#10b981";
                          if (z.includes("RING 3")) return "#000000";
                          if (z.includes("RING 4")) return "#ef4444";
                          return "inherit";
                        })()
                      }}>
                        {row.zona || '-'}
                      </span>
                    </td>
                    <td style={{ color: '#1e293b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.nama_lengkap}</td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem', padding: '5px 12px' }}>{row.nik}</td>
                    <td style={{ padding: '5px 12px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: (row.jenis_kelamin || '').toString().toUpperCase().startsWith('L') ? '#075985' : '#991b1b'
                      }}>
                        {(row.jenis_kelamin || '').toString().toUpperCase().startsWith('L') ? 'LAKI-LAKI' : 'PEREMPUAN'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.umur || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.pendidikan || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.pekerjaan || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.hubungan_keluarga || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.pendidikan_terakhir || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.skill || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.status_kerja || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.tempat_bekerja || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.no_hp_wa || '-'}</td>
                    <td style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{row.email || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Box>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination 
            count={Math.ceil(filteredData.length / itemsPerPage)} 
            page={page} 
            onChange={(e,v) => setPage(v)} 
            sx={{ 
              '& .MuiPaginationItem-root': { fontWeight: 700 },
              '& .Mui-selected': { bgcolor: '#10b981 !important', color: 'white' } 
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default DataPreviewPenduduk;
