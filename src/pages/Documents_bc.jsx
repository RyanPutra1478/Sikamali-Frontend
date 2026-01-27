import React, { useEffect, useState } from 'react';
import { adminAPI, documentAPI } from '../services/api';
import { wilayahAPI } from '../services/wilayahAPI';
import { determineRing } from '../utils/ringZones';
import './Documents.css';
import './AdminPage.css'; // supaya gaya tabel & modal dari AdminKK kepakai

// --- HELPER: VALIDASI FIELD ---
const RequiredMark = () => <span className="required-mark">*</span>;

// --- COMPONENT: POPUP ANIMASI SUBMIT FORM KK ---
const SubmitOverlay = ({ status }) => {
  if (status === 'idle') return null;

  return (
    <div className="submit-overlay">
      <div className="submit-content">
        {status === 'loading' && (
          <>
            <div className="spinner"></div>
            <h3>Sedang Menyimpan Data...</h3>
            <p>Mohon jangan tutup halaman ini.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="checkmark-circle">
              <span className="checkmark">✓</span>
            </div>
            <h3>Berhasil Disimpan!</h3>
            <p>Data telah masuk ke sistem.</p>
          </>
        )}
      </div>
    </div>
  );
};

// --- HELPER: DEFAULT MEMBER & UTIL LAIN ---
const createDefaultKKMember = () => ({
  nama: '',
  nik: '',
  hubungan_keluarga: '',
  jenis_kelamin: '',
  golongan_darah: '',
  agama: '',
  status_perkawinan: '',
  tanggal_perkawinan: '',
  kewarganegaraan: 'WNI',
  status_domisili: 'Penduduk Asli',
  no_passport: '',
  no_kitap: '',
  nama_ayah: '',
  nama_ibu: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  pendidikan: '',
  pendidikan_terakhir: '',
  skill: '',
  status_kerja: '',
  tempat_bekerja: '',
  no_hp: '',
  email: '',
  alamat: '',
});

const formatDate = (dateString) =>
  dateString ? new Date(dateString).toLocaleDateString('id-ID') : '-';

const formatDateInput = (dateString) =>
  dateString ? new Date(dateString).toISOString().split('T')[0] : '';

const getAge = (dateString) => {
  if (!dateString) return '-';
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// --- COMPONENT: FORM ANGGOTA (gaya Documents) ---
function KKMembersForm({ title, members, onChange, onAdd, onRemove, disabled }) {
  return (
    <div className="anggota-section">
      <div className="anggota-header">
        <h4>{title}</h4>
        {!disabled && (
          <button type="button" onClick={onAdd} className="btn-add">
            + Tambah Anggota
          </button>
        )}
      </div>

      {members.length === 0 && (
        <p className="empty-state">Belum ada anggota ditambahkan.</p>
      )}

      {members.map((member, index) => (
        <div key={index} className="anggota-item">
          <div className="anggota-item-header">
            <strong>Anggota #{index + 1}</strong>
            {!disabled && members.length > 1 && (
              <button
                type="button"
                className="btn-text"
                onClick={() => onRemove(index)}
              >
                Hapus
              </button>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Nama Lengkap <RequiredMark />
              </label>
              <input
                type="text"
                value={member.nama || ''}
                onChange={(e) => onChange(index, 'nama', e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            <div className="form-group">
              <label>
                NIK (16 Digit) <RequiredMark />
              </label>
              <input
                type="text"
                value={member.nik || ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 16) onChange(index, 'nik', val);
                }}
                disabled={disabled}
                required
                placeholder="16 Digit Angka"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Hubungan Keluarga</label>
              <select
                value={member.hubungan_keluarga || ''}
                onChange={(e) =>
                  onChange(index, 'hubungan_keluarga', e.target.value)
                }
                disabled={disabled}
              >
                <option value="">Pilih Hubungan</option>
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
                <option value="Menantu">Menantu</option>
                <option value="Cucu">Cucu</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Mertua">Mertua</option>
                <option value="Famili Lain">Famili Lain</option>
              </select>
            </div>
            <div className="form-group">
              <label>Jenis Kelamin</label>
              <select
                value={member.jenis_kelamin || ''}
                onChange={(e) =>
                  onChange(index, 'jenis_kelamin', e.target.value)
                }
                disabled={disabled}
              >
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tempat Lahir</label>
              <input
                type="text"
                value={member.tempat_lahir || ''}
                onChange={(e) =>
                  onChange(index, 'tempat_lahir', e.target.value)
                }
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>Tanggal Lahir</label>
              <input
                type="date"
                value={
                  member.tanggal_lahir
                    ? member.tanggal_lahir.split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onChange(index, 'tanggal_lahir', e.target.value)
                }
                disabled={disabled}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Agama</label>
              <select
                value={member.agama || ''}
                onChange={(e) => onChange(index, 'agama', e.target.value)}
                disabled={disabled}
              >
                <option value="">Pilih Agama</option>
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Konghucu">Konghucu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status Perkawinan</label>
              <select
                value={member.status_perkawinan || ''}
                onChange={(e) =>
                  onChange(index, 'status_perkawinan', e.target.value)
                }
                disabled={disabled}
              >
                <option value="">Pilih Status</option>
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>
          </div>

          {member.status_perkawinan === 'Kawin' && (
            <div className="form-row">
              <div className="form-group">
                <label>Tanggal Perkawinan</label>
                <input
                  type="date"
                  value={
                    member.tanggal_perkawinan
                      ? member.tanggal_perkawinan.split('T')[0]
                      : ''
                  }
                  onChange={(e) =>
                    onChange(index, 'tanggal_perkawinan', e.target.value)
                  }
                  disabled={disabled}
                />
              </div>
              <div className="form-group" />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Pendidikan</label>
              <select
                value={member.pendidikan || ''}
                onChange={(e) =>
                  onChange(index, 'pendidikan', e.target.value)
                }
                disabled={disabled}
              >
                <option value="">Pilih Pendidikan</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA/SMK">SMA/SMK</option>
                <option value="D3">D3</option>
                <option value="S1">S1</option>
                <option value="S2">S2</option>
                <option value="S3">S3</option>
                <option value="Tidak/Belum Sekolah">
                  Tidak/Belum Sekolah
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Pekerjaan</label>
              <input
                type="text"
                value={member.status_kerja || ''}
                onChange={(e) =>
                  onChange(index, 'status_kerja', e.target.value)
                }
                disabled={disabled}
                placeholder="Petani/Karyawan/Belum Bekerja"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kewarganegaraan</label>
              <select
                value={member.kewarganegaraan || 'WNI'}
                onChange={(e) =>
                  onChange(index, 'kewarganegaraan', e.target.value)
                }
                disabled={disabled}
              >
                <option value="WNI">WNI</option>
                <option value="WNA">WNA</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status Domisili</label>
              <select
                value={member.status_domisili || 'Penduduk Asli'}
                onChange={(e) =>
                  onChange(index, 'status_domisili', e.target.value)
                }
                disabled={disabled}
              >
                <option value="Penduduk Asli">Penduduk Asli</option>
                <option value="Pendatang">Pendatang</option>
                <option value="Merantau">Merantau</option>
                <option value="Pindah">Pindah</option>
                <option value="Meninggal">Meninggal</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>No. Passport (Opsional)</label>
              <input
                type="text"
                value={member.no_passport || ''}
                onChange={(e) =>
                  onChange(index, 'no_passport', e.target.value)
                }
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>No. KITAP (Khusus WNA)</label>
              <input
                type="text"
                value={member.no_kitap || ''}
                onChange={(e) =>
                  onChange(index, 'no_kitap', e.target.value)
                }
                disabled={disabled}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Golongan Darah</label>
              <select
                value={member.golongan_darah || '-'}
                onChange={(e) =>
                  onChange(index, 'golongan_darah', e.target.value)
                }
                disabled={disabled}
              >
                <option value="-">-</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
            <div className="form-group">
              <label>No. HP / WA</label>
              <input
                type="text"
                value={member.no_hp || ''}
                onChange={(e) =>
                  onChange(index, 'no_hp', e.target.value)
                }
                disabled={disabled}
                placeholder="08..."
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email (Opsional)</label>
              <input
                type="email"
                value={member.email || ''}
                onChange={(e) =>
                  onChange(index, 'email', e.target.value)
                }
                disabled={disabled}
              />
            </div>
            <div className="form-group" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nama Ayah</label>
              <input
                type="text"
                value={member.nama_ayah || ''}
                onChange={(e) =>
                  onChange(index, 'nama_ayah', e.target.value)
                }
                disabled={disabled}
              />
            </div>
            <div className="form-group">
              <label>Nama Ibu</label>
              <input
                type="text"
                value={member.nama_ibu || ''}
                onChange={(e) =>
                  onChange(index, 'nama_ibu', e.target.value)
                }
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function Documents({ user, readOnly }) {
  // STATE UNTUK FORM INPUT KK
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');

  const [kkForm, setKkForm] = useState({
    nomor_kk: '',
    kepala_keluarga: '',
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kecamatan: '',
    desa: '',
    zona_lingkar_tambang: '',
    status_domisili: 'Penduduk Asli',
    tanggal_diterbitkan: '',
    members: [createDefaultKKMember()],
  });

  // STATE WILAYAH (untuk input)
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [regencyOptions, setRegencyOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedRegencyId, setSelectedRegencyId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  // STATE UNTUK LIST KK (gaya AdminKK)
  const [kkList, setKkList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKK, setSelectedKK] = useState(null);
  const [editKK, setEditKK] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --- LIFECYCLE ---
  useEffect(() => {
    loadProvinces();
    loadKKList();
  }, []);

  // Auto hitung zona lingkar tambang
  useEffect(() => {
    setKkForm((prev) => {
      const ring = determineRing(prev);
      if (prev.zona_lingkar_tambang === ring) return prev;
      return { ...prev, zona_lingkar_tambang: ring };
    });
  }, [kkForm.provinsi, kkForm.kabupaten, kkForm.kecamatan, kkForm.desa]);

  // --- LOAD DATA WILAYAH ---
  const loadProvinces = async () => {
    try {
      const data = await wilayahAPI.getProvinces();
      setProvinceOptions(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadRegencies = async (provinceId) => {
    if (!provinceId) return [];
    try {
      const data = await wilayahAPI.getRegencies(provinceId);
      setRegencyOptions(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadDistricts = async (regencyId) => {
    if (!regencyId) return [];
    try {
      const data = await wilayahAPI.getDistricts(regencyId);
      setDistrictOptions(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const loadVillages = async (districtId) => {
    if (!districtId) return [];
    try {
      const data = await wilayahAPI.getVillages(districtId);
      setVillageOptions(data);
      return data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // --- HANDLER SELECT WILAYAH ---
  const handleProvinceSelect = async (e) => {
    const provinceId = e.target.value;
    setSelectedProvinceId(provinceId);
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setRegencyOptions([]);
    setDistrictOptions([]);
    setVillageOptions([]);

    const provinceName =
      provinceOptions.find((opt) => opt.id === provinceId)?.name || '';
    setKkForm((prev) => ({
      ...prev,
      provinsi: provinceName,
      kabupaten: '',
      kecamatan: '',
      desa: '',
    }));

    if (provinceId) await loadRegencies(provinceId);
  };

  const handleRegencySelect = async (e) => {
    const regencyId = e.target.value;
    setSelectedRegencyId(regencyId);
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setDistrictOptions([]);
    setVillageOptions([]);

    const regencyName =
      regencyOptions.find((opt) => opt.id === regencyId)?.name || '';
    setKkForm((prev) => ({
      ...prev,
      kabupaten: regencyName,
      kecamatan: '',
      desa: '',
    }));

    if (regencyId) await loadDistricts(regencyId);
  };

  const handleDistrictSelect = async (e) => {
    const districtId = e.target.value;
    setSelectedDistrictId(districtId);
    setSelectedVillageId('');
    setVillageOptions([]);

    const districtName =
      districtOptions.find((opt) => opt.id === districtId)?.name || '';
    setKkForm((prev) => ({
      ...prev,
      kecamatan: districtName,
      desa: '',
    }));

    if (districtId) await loadVillages(districtId);
  };

  const handleVillageSelect = (e) => {
    const villageId = e.target.value;
    setSelectedVillageId(villageId);
    const villageName =
      villageOptions.find((opt) => opt.id === villageId)?.name || '';
    setKkForm((prev) => ({ ...prev, desa: villageName }));
  };

  // --- HANDLER FORM KK ---
  const handleKKFieldChange = (e) => {
    const { name, value } = e.target;
    setKkForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateKkMember = (index, field, value) => {
    setKkForm((prev) => {
      const members = [...prev.members];
      members[index] = { ...members[index], [field]: value };
      return { ...prev, members };
    });
  };

  const addKkMember = () =>
    setKkForm((prev) => ({
      ...prev,
      members: [...prev.members, createDefaultKKMember()],
    }));

  const removeKkMember = (index) =>
    setKkForm((prev) => ({
      ...prev,
      members: prev.members.filter((_, idx) => idx !== index),
    }));

  // --- SUBMIT FORM KK (buat data baru) ---
  const handleKKSubmit = async (e) => {
    e.preventDefault();
    if (submitStatus === 'loading') return;

    if (!kkForm.nomor_kk) {
      setError('Nomor KK wajib diisi.');
      return;
    }
    if (kkForm.nomor_kk.length !== 16) {
      setError('Nomor KK harus 16 digit angka.');
      return;
    }
    if (
      !kkForm.provinsi ||
      !kkForm.kabupaten ||
      !kkForm.kecamatan ||
      !kkForm.desa
    ) {
      setError('Provinsi, Kabupaten, Kecamatan, dan Desa wajib diisi.');
      return;
    }

    for (const m of kkForm.members) {
      if (!m.nama || !m.nik) {
        setError('Nama dan NIK Anggota wajib diisi.');
        return;
      }
      if (m.nik.length !== 16) {
        setError(`NIK anggota ${m.nama} tidak valid (harus 16 digit).`);
        return;
      }
    }

    setSubmitStatus('loading');
    setMessage('');
    setError('');

    try {
      await documentAPI.createKKManual({
        ...kkForm,
        members: kkForm.members,
      });

      setSubmitStatus('success');

      setTimeout(() => {
        setKkForm({
          nomor_kk: '',
          kepala_keluarga: '',
          alamat: '',
          provinsi: '',
          kabupaten: '',
          kecamatan: '',
          desa: '',
          zona_lingkar_tambang: '',
          status_domisili: 'Penduduk Asli',
          tanggal_diterbitkan: '',
          members: [createDefaultKKMember()],
        });
        setSelectedProvinceId('');
        setSelectedRegencyId('');
        setSelectedDistrictId('');
        setSelectedVillageId('');

        setMessage('Data KK tersimpan!');
        setSubmitStatus('idle');
        // refresh list KK di bawah
        loadKKList();
      }, 1500);
    } catch (err) {
      setSubmitStatus('idle');
      setError(
        err.response?.data?.error || err.message || 'Gagal menyimpan data KK'
      );
    }
  };

  // --- LOAD LIST KK (gaya AdminKK) ---
  const loadKKList = async () => {
    setListLoading(true);
    try {
      let result = [];

      if (role === 'admin' || role === 'executive_guest') {
        // Admin & Guest pakai endpoint admin (data semua KK)
        const data = await adminAPI.getKK();
        result = Array.isArray(data) ? data : [];
      } else {
        // User biasa: pakai /documents (hanya dokumen miliknya)
        const docs = await documentAPI.get();
        const kkDocs = (Array.isArray(docs) ? docs : []).filter(
          (d) => d.type === 'KK'
        );

        // Samakan struktur dengan data dari adminAPI.getKK()
        result = kkDocs.map((doc) => ({
          id: doc.id, // dipakai sebagai key row
          document_id: doc.id, // dipakai untuk update/delete
          nomor_kk: doc.nomor_kk,
          kepala_keluarga: doc.kepala_keluarga,
          alamat: doc.alamat_kk_lengkap || doc.alamat_kk || doc.alamat,
          desa_kelurahan: doc.desa,
          kecamatan: doc.kecamatan,
          kabupaten: doc.kabupaten,
          provinsi: doc.provinsi,
          zona_lingkar_tambang: doc.zona_lingkar_tambang,
          status_domisili: doc.kk_domisili || doc.status_domisili,
          tanggal_diterbitkan: doc.tanggal_diterbitkan,
          members: doc.members || [],
        }));
      }

      setKkList(result);
    } catch (err) {
      console.error('Load KK error:', err);
    } finally {
      setListLoading(false);
    }
  };


  // --- EXPORT CSV (dari AdminKK) ---
  const handleExport = () => {
    if (kkList.length === 0) return alert('Tidak ada data untuk diekspor');

    let csvContent =
      'No,No Kartu Keluarga,Kepala Keluarga,Alamat,Desa,Kecamatan,Jml Anggota\n';

    kkList.forEach((item, index) => {
      csvContent += `${index + 1},'${
        item.nomor_kk
      },"${item.kepala_keluarga}","${item.alamat}","${
        item.desa_kelurahan
      }","${item.kecamatan}",${item.members?.length || 0}\n`;
    });

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Data_KK_Sikamali.csv');
    document.body.appendChild(link);
    link.click();
  };

  // --- FILTER SEARCH LIST KK ---
  const filteredList = kkList.filter(
    (item) =>
      (item.kepala_keluarga &&
        item.kepala_keluarga
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (item.nomor_kk && item.nomor_kk.includes(searchTerm)) ||
      (item.desa_kelurahan &&
        item.desa_kelurahan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- HANDLER MODAL EDIT (gaya AdminKK) ---
  const openEditModalKK = (item) => {
    const membersCopy = item.members ? JSON.parse(JSON.stringify(item.members)) : [];
    setEditKK({
      document_id: item.document_id,
      nomor_kk: item.nomor_kk || '',
      kepala_keluarga: item.kepala_keluarga || '',
      alamat: item.alamat || '',
      provinsi: item.provinsi || '',
      kabupaten: item.kabupaten || '',
      kecamatan: item.kecamatan || '',
      desa: item.desa || '',
      zona_lingkar_tambang: item.zona_lingkar_tambang || '',
      status_domisili: item.status_domisili || '',
      tanggal_diterbitkan: formatDateInput(item.tanggal_diterbitkan),
      members: membersCopy,
    });
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...editKK.members];
    updatedMembers[index][field] = value;
    setEditKK({ ...editKK, members: updatedMembers });
  };

  const removeMember = (index) => {
    if (window.confirm('Hapus anggota keluarga ini?')) {
      const updatedMembers = editKK.members.filter((_, i) => i !== index);
      setEditKK({ ...editKK, members: updatedMembers });
    }
  };

  const addMember = () => {
    const newMember = {
      nama: '',
      nik: '',
      jenis_kelamin: 'Laki-laki',
      hubungan_keluarga: 'Anak',
      status_domisili: 'Penduduk Asli',
      kewarganegaraan: 'WNI',
    };
    setEditKK({ ...editKK, members: [...editKK.members, newMember] });
  };

  const handleUpdateKK = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await documentAPI.update(editKK.document_id, {
        type: 'KK',
        ...editKK,
        alamat_kk: editKK.alamat,
      });
      await loadKKList();
      setEditKK(null);
      alert('Data berhasil diperbarui!');
    } catch (err) {
      alert(err.message || 'Gagal update');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteKK = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await documentAPI.remove(deleteTarget.document_id);
      await loadKKList();
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'Gagal menghapus data');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="documents-page">
      {/* Overlay untuk proses submit form input KK */}
      <SubmitOverlay status={submitStatus} />

      {/* HEADER FORM INPUT */}
      <div className="documents-header">
        <div>
          <p className="section-label">Input Data Kependudukan</p>
          <h2>Data Kartu Keluarga (KK)</h2>
          <p
            style={{
              color: '#6b7280',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            Nomor KK sebagai main key dari semua data.
          </p>
        </div>
      </div>

      {(message || error) && (
        <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
          {error || message}
        </div>
      )}

      {/* FORM INPUT KK (gaya lama Documents.jsx) */}
      <div className="upload-section">
        <h3>Input Data KK</h3>
        <form className="kk-form" onSubmit={handleKKSubmit}>
          <h4>Data Kartu Keluarga</h4>

          <div className="form-row">
            <div className="form-group">
              <label>
                Nomor KK (16 Digit) <RequiredMark />
              </label>
              <input
                type="text"
                name="nomor_kk"
                value={kkForm.nomor_kk}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 16)
                    handleKKFieldChange({
                      target: { name: 'nomor_kk', value: val },
                    });
                }}
                required
                placeholder="16 Digit Angka"
              />
            </div>
            <div className="form-group">
              <label>
                Kepala Keluarga <RequiredMark />
              </label>
              <input
                type="text"
                name="kepala_keluarga"
                value={kkForm.kepala_keluarga}
                onChange={handleKKFieldChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Provinsi <RequiredMark />
              </label>
              <select
                value={selectedProvinceId}
                onChange={handleProvinceSelect}
                required
              >
                <option value="">Pilih Provinsi</option>
                {provinceOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Kabupaten <RequiredMark />
              </label>
              <select
                value={selectedRegencyId}
                onChange={handleRegencySelect}
                required
                disabled={!selectedProvinceId}
              >
                <option value="">Pilih Kabupaten</option>
                {regencyOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Kecamatan <RequiredMark />
              </label>
              <select
                value={selectedDistrictId}
                onChange={handleDistrictSelect}
                required
                disabled={!selectedRegencyId}
              >
                <option value="">Pilih Kecamatan</option>
                {districtOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Desa <RequiredMark />
              </label>
              <select
                value={selectedVillageId}
                onChange={handleVillageSelect}
                required
                disabled={!selectedDistrictId}
              >
                <option value="">Pilih Desa</option>
                {villageOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Zona Lingkar Tambang</label>
              <input
                type="text"
                name="zona_lingkar_tambang"
                value={kkForm.zona_lingkar_tambang}
                readOnly
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                placeholder="Otomatis"
              />
            </div>
            <div className="form-group">
              <label>
                Status Domisili KK <RequiredMark />
              </label>
              <select
                name="status_domisili"
                value={kkForm.status_domisili}
                onChange={handleKKFieldChange}
                required
              >
                <option value="Penduduk Asli">Penduduk Asli</option>
                <option value="Pendatang">Pendatang</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Tanggal KK Diterbitkan</label>
            <input
              type="date"
              name="tanggal_diterbitkan"
              value={kkForm.tanggal_diterbitkan}
              onChange={handleKKFieldChange}
            />
          </div>

          <div className="form-group">
            <label>Alamat Lengkap</label>
            <textarea
              name="alamat"
              value={kkForm.alamat}
              onChange={handleKKFieldChange}
              rows="3"
            />
          </div>

          <KKMembersForm
            title="Anggota Keluarga"
            members={kkForm.members}
            onChange={updateKkMember}
            onAdd={addKkMember}
            onRemove={removeKkMember}
            disabled={submitStatus === 'loading'}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={submitStatus === 'loading'}
            style={{
              opacity: submitStatus === 'loading' ? 0.6 : 1,
              cursor: submitStatus === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            Simpan Data KK
          </button>
        </form>
      </div>

      {/* LIST & MODAL KK (GAYA AdminKK.jsx) */}
      <div className="admin-page" style={{ marginTop: '2rem' }}>
        <div className="page-header">
          <div>
            <h2>Data Kartu Keluarga</h2>
            <p className="subtitle">Total: {filteredList.length} KK Terdaftar</p>
          </div>

          <div
            className="header-actions"
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Cari No KK / Nama / Desa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {!readOnly && (
              <button
                onClick={handleExport}
                className="btn-view"
                style={{
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                📥 CSV
              </button>
            )}
          </div>
        </div>

        {listLoading ? (
          <div className="p-4 text-center">Sedang memuat data...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>No Kartu Keluarga</th>
                  <th>Kepala Keluarga</th>
                  <th>Alamat</th>
                  <th>Desa</th>
                  <th>Zona</th>
                  <th>Domisili KK</th>
                  <th>Jml</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.nomor_kk}</strong>
                    </td>
                    <td>{item.kepala_keluarga}</td>
                    <td>{item.alamat}</td>
                    <td>{item.desa_kelurahan}</td>
                    <td>{item.zona_lingkar_tambang}</td>
                    <td>{item.status_domisili}</td>
                    <td>
                      <span className="badge-count">
                        {item.members?.length || 0}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-view"
                          onClick={() => setSelectedKK(item)}
                          title="Lihat"
                        >
                          👁️
                        </button>
                        {!readOnly && (
                          <>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openEditModalKK(item)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => setDeleteTarget(item)}
                              title="Hapus"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center' }}>
                      Belum ada data KK.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL VIEW DETAIL KK */}
        {selectedKK && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedKK(null)}
          >
            <div
              className="modal-content modal-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Detail Data Keluarga</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedKK(null)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="kk-digital-card">
                  <div className="kk-card-header">
                    <div className="kk-title">
                      <span>KARTU KELUARGA</span>
                      <h2>NO. {selectedKK.nomor_kk}</h2>
                    </div>
                    <div className="kk-logo">🇮🇩</div>
                  </div>
                  <div className="kk-card-body">
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Kepala Keluarga</label>
                        <p>{selectedKK.kepala_keluarga}</p>
                      </div>
                      <div className="info-item">
                        <label>NIK KK</label>
                        <p>{selectedKK.user_nik || '-'}</p>
                      </div>
                      <div className="info-item">
                        <label>Alamat</label>
                        <p>{selectedKK.alamat}</p>
                      </div>
                      <div className="info-item">
                        <label>Desa/Kelurahan</label>
                        <p>{selectedKK.desa_kelurahan}</p>
                      </div>
                      <div className="info-item">
                        <label>Kecamatan</label>
                        <p>{selectedKK.kecamatan}</p>
                      </div>
                      <div className="info-item">
                        <label>Kabupaten</label>
                        <p>{selectedKK.kabupaten || '-'}</p>
                      </div>
                      <div className="info-item">
                        <label>Provinsi</label>
                        <p>{selectedKK.provinsi}</p>
                      </div>
                      <div className="info-item">
                        <label>Zona Lingkar</label>
                        <p>{selectedKK.zona_lingkar_tambang}</p>
                      </div>
                      <div className="info-item">
                        <label>Status Domisili</label>
                        <p>{selectedKK.status_domisili}</p>
                      </div>
                      <div className="info-item">
                        <label>Tgl Terbit</label>
                        <p>{formatDate(selectedKK.tanggal_diterbitkan)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h4
                  style={{
                    margin: '20px 0 10px',
                    color: '#374151',
                    borderBottom: '2px solid #10b981',
                    display: 'inline-block',
                    paddingBottom: '5px',
                  }}
                >
                  Daftar Anggota Keluarga ({selectedKK.members?.length || 0})
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {selectedKK.members?.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #f3f4f6',
                          paddingBottom: '10px',
                          marginBottom: '10px',
                        }}
                      >
                        <strong
                          style={{
                            color: '#10b981',
                            fontSize: '1.1rem',
                          }}
                        >
                          {m.nama}
                        </strong>
                        <span
                          className="badge-count"
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                          }}
                        >
                          No. {idx + 1}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            NIK
                          </label>
                          <strong>{m.nik}</strong>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            L/P
                          </label>
                          {m.jenis_kelamin}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            TTL
                          </label>
                          {m.tempat_lahir}, {formatDate(m.tanggal_lahir)}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Agama
                          </label>
                          {m.agama || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Pendidikan
                          </label>
                          {m.pendidikan || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Status Kerja
                          </label>
                          {m.status_kerja || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Golongan darah
                          </label>
                          {m.golongan_darah || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Status Kawin
                          </label>
                          {m.status_perkawinan || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Tanggal nikah
                          </label>
                          {formatDate(m.tanggal_perkawinan)}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Kewarganegaraan
                          </label>
                          {m.kewarganegaraan || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Hubungan
                          </label>
                          <strong>{m.hubungan_keluarga}</strong>
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Umur
                          </label>
                          {getAge(m.tanggal_lahir)} Thn
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            No Paspor
                          </label>
                          {m.no_passport || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            No KITAP
                          </label>
                          {m.no_kitap || '-'}
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Domisili
                          </label>
                          {m.status_domisili || '-'}
                        </div>

                        <div
                          style={{
                            gridColumn: 'span 2',
                            borderTop: '1px dashed #e5e7eb',
                            paddingTop: '8px',
                            marginTop: '4px',
                          }}
                        >
                          <label
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              display: 'block',
                            }}
                          >
                            Nama Orang Tua
                          </label>
                          Ayah:{' '}
                          <strong>{m.nama_ayah || '-'}</strong> | Ibu:{' '}
                          <strong>{m.nama_ibu || '-'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedKK(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL EDIT KK */}
        {editKK && (
          <div className="modal-overlay">
            <div className="modal-content modal-xl">
              <div className="modal-header">
                <h3>Edit Data & Anggota</h3>
              </div>
              <form
                onSubmit={handleUpdateKK}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <div className="modal-body">
                  {/* A: MASTER DATA KK */}
                  <div
                    className="form-section"
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h4
                      style={{
                        marginTop: 0,
                        borderBottom: '2px solid #10b981',
                        display: 'inline-block',
                        paddingBottom: '5px',
                        color: '#10b981',
                      }}
                    >
                      A. Data Kepala Keluarga & Lokasi
                    </h4>
                    <div
                      className="form-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '15px',
                        marginTop: '15px',
                      }}
                    >
                      <div className="form-group">
                        <label>Nomor KK</label>
                        <input
                          className="input-field"
                          value={editKK.nomor_kk}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              nomor_kk: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Kepala Keluarga</label>
                        <input
                          className="input-field"
                          value={editKK.kepala_keluarga}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              kepala_keluarga: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Alamat</label>
                        <input
                          className="input-field"
                          value={editKK.alamat}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              alamat: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Desa/Kelurahan</label>
                        <input
                          className="input-field"
                          value={editKK.desa}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              desa: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Kecamatan</label>
                        <input
                          className="input-field"
                          value={editKK.kecamatan}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              kecamatan: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Zona Lingkar</label>
                        <input
                          className="input-field"
                          value={editKK.zona_lingkar_tambang}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              zona_lingkar_tambang: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Status Domisili (KK)</label>
                        <select
                          className="input-field"
                          value={editKK.status_domisili || ''}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              status_domisili: e.target.value,
                            })
                          }
                        >
                          <option value="">- Pilih Status -</option>
                          <option value="Penduduk Asli">Penduduk Asli</option>
                          <option value="Pendatang">Pendatang</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tgl Terbit KK</label>
                        <input
                          type="date"
                          className="input-field"
                          value={editKK.tanggal_diterbitkan}
                          onChange={(e) =>
                            setEditKK({
                              ...editKK,
                              tanggal_diterbitkan: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* B: DATA ANGGOTA */}
                  <div
                    className="form-section"
                    style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '1px solid #f3f4f6',
                        paddingBottom: '10px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          color: '#374151',
                        }}
                      >
                        B. Data Anggota Keluarga ({editKK.members.length})
                      </h4>
                      <button
                        type="button"
                        onClick={addMember}
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px dashed #1d4ed8',
                          padding: '8px 15px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        + Tambah Anggota
                      </button>
                    </div>

                    {editKK.members.map((m, i) => (
                      <div key={i} className="member-edit-card">
                        <div className="member-card-header">
                          <span className="member-number">
                            Anggota #{i + 1}
                          </span>
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeMember(i)}
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label>Nama</label>
                            <input
                              className="input-field"
                              value={m.nama}
                              onChange={(e) =>
                                handleMemberChange(i, 'nama', e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>NIK</label>
                            <input
                              className="input-field"
                              value={m.nik}
                              onChange={(e) =>
                                handleMemberChange(i, 'nik', e.target.value)
                              }
                            />
                          </div>

                          <div className="form-group">
                            <label>Hubungan</label>
                            <select
                              className="input-field"
                              value={m.hubungan_keluarga}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'hubungan_keluarga',
                                  e.target.value
                                )
                              }
                            >
                              <option value="Kepala Keluarga">
                                Kepala Keluarga
                              </option>
                              <option value="Istri">Istri</option>
                              <option value="Anak">Anak</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Status Domisili</label>
                            <select
                              className="input-field"
                              value={m.status_domisili || ''}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'status_domisili',
                                  e.target.value
                                )
                              }
                            >
                              <option value="">- Pilih Status -</option>
                              <option value="Penduduk Asli">
                                Penduduk Asli
                              </option>
                              <option value="Pendatang">Pendatang</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>JK</label>
                            <select
                              className="input-field"
                              value={m.jenis_kelamin}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'jenis_kelamin',
                                  e.target.value
                                )
                              }
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Tempat Lahir</label>
                            <input
                              className="input-field"
                              value={m.tempat_lahir}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'tempat_lahir',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Tgl Lahir</label>
                            <input
                              type="date"
                              className="input-field"
                              value={formatDateInput(m.tanggal_lahir)}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'tanggal_lahir',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Agama</label>
                            <input
                              className="input-field"
                              value={m.agama}
                              onChange={(e) =>
                                handleMemberChange(i, 'agama', e.target.value)
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Status Kawin</label>
                            <input
                              className="input-field"
                              value={m.status_perkawinan}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'status_perkawinan',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Tgl Kawin</label>
                            <input
                              type="date"
                              className="input-field"
                              value={formatDateInput(m.tanggal_perkawinan)}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'tanggal_perkawinan',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Pekerjaan</label>
                            <input
                              className="input-field"
                              value={m.status_kerja}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'status_kerja',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Pendidikan</label>
                            <input
                              className="input-field"
                              value={m.pendidikan}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'pendidikan',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Gol. Darah</label>
                            <input
                              className="input-field"
                              value={m.golongan_darah}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'golongan_darah',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Kewarganegaraan</label>
                            <input
                              className="input-field"
                              value={m.kewarganegaraan}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'kewarganegaraan',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>No Paspor</label>
                            <input
                              className="input-field"
                              value={m.no_passport}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'no_passport',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>No KITAP</label>
                            <input
                              className="input-field"
                              value={m.no_kitap}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'no_kitap',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Nama Ayah</label>
                            <input
                              className="input-field"
                              value={m.nama_ayah}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'nama_ayah',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label>Nama Ibu</label>
                            <input
                              className="input-field"
                              value={m.nama_ibu}
                              onChange={(e) =>
                                handleMemberChange(
                                  i,
                                  'nama_ibu',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditKK(null)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={actionLoading}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DELETE KK */}
        {deleteTarget && (
          <div className="modal-overlay">
            <div className="modal-content modal-sm">
              <h3>Hapus Data</h3>
              <p>
                Yakin hapus KK <strong>{deleteTarget.nomor_kk}</strong>?
              </p>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteTarget(null)}
                >
                  Batal
                </button>
                <button
                  className="btn-delete"
                  onClick={handleDeleteKK}
                  disabled={actionLoading}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
