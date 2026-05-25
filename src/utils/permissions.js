// frontend/src/utils/permissions.js

export const ROLE_PERMISSIONS = {
  // ===========================================================================
  // 1) SUPER_ADMIN
  // - FULL ACCESS UNTUK SEMUA LAYANAN
  // ===========================================================================
  superadmin: {
    management: {
      users: { view: true, create: true, edit: true, delete: true },
      announcements: { view: true, create: true, edit: true, delete: true },
    },
    database: {
      kk: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
      employment: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
      kesejahteraan: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
    },
    dataPreview: {
      penduduk: { view: true, edit: true, delete: true, copy: true, export: true },
      employment: { view: true, edit: true, delete: true, copy: true, export: true },
      kesejahteraan: { view: true, edit: true, delete: true, copy: true, export: true },
    },
    lokasiZona: {
      land: { view: true, insert: true, edit: true, delete: true, copy: true },
    },
  },

  // ===========================================================================
  // 2) ADMIN
  // - CUMA DATABASE, DATA PREVIEW DAN LOKASI & DOMISILI
  // - Full Access (CRUD) untuk layanan tersebut
  // ===========================================================================
  admin: {
    management: {
      users: { view: false, create: false, edit: false, delete: false },
      announcements: { view: false, create: false, edit: false, delete: false },
    },
    database: {
      kk: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
      employment: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
      kesejahteraan: { view: true, insert: true, edit: true, delete: true, copy: true, export: true },
    },
    dataPreview: {
      penduduk: { view: true, edit: true, delete: true, copy: true, export: true },
      employment: { view: true, edit: true, delete: true, copy: true, export: true },
      kesejahteraan: { view: true, edit: true, delete: true, copy: true, export: true },
    },
    lokasiZona: {
      // Full Access restored as per request
      land: { view: true, insert: true, edit: true, delete: true, copy: true },
    },
  },

  // ===========================================================================
  // 3) USER
  // - CUMA CREATE ONLY UNTUK DATABASE
  // - Tidak ada akses Data Preview, Lokasi, dll.
  // ===========================================================================
  user: {
    management: {
      users: { view: false, create: false, edit: false, delete: false },
      announcements: { view: false, create: false, edit: false, delete: false },
    },
    database: {
      // View, Insert, Edit = TRUE. Delete/Copy/Export = FALSE.
      kk: { view: true, insert: true, edit: true, delete: false, copy: false, export: false },
      employment: { view: true, insert: true, edit: true, delete: false, copy: false, export: false },
      kesejahteraan: { view: true, insert: true, edit: true, delete: false, copy: false, export: false },
    },
    dataPreview: {
      // View Only
      penduduk: { view: true, edit: false, delete: false, copy: false, export: false },
      employment: { view: true, edit: false, delete: false, copy: false, export: false },
      kesejahteraan: { view: true, edit: false, delete: false, copy: false, export: false },
    },
    lokasiZona: {
      // Access ke Lokasi dan Domisili (View only for general user/resident)
      land: { view: true, insert: true, edit: false, delete: false, copy: false },
    },
  },

  // ===========================================================================
  // 4) GUEST
  // - FULL READ ONLY DATA PREVIEW
  // ===========================================================================
  guest: {
    management: {
      users: { view: false, create: false, edit: false, delete: false },
      announcements: { view: false, create: false, edit: false, delete: false },
    },
    database: {
      kk: { view: false, insert: false, edit: false, delete: false, copy: false },
      employment: { view: false, insert: false, edit: false, delete: false, copy: false },
      kesejahteraan: { view: false, insert: false, edit: false, delete: false, copy: false },
    },
    dataPreview: {
      // Read Only
      penduduk: { view: true, edit: false, delete: false, copy: false, export: false },
      employment: { view: true, edit: false, delete: false, copy: false, export: false },
      kesejahteraan: { view: true, edit: false, delete: false, copy: false, export: false },
    },
    lokasiZona: {
      // Read only ke Lokasi dan Domisili
      land: { view: true, insert: false, edit: false, delete: false, copy: false },
    },
  },

  // ===========================================================================
  // 5) VIEWER
  // - HANYA BISA MENGAKSES DATA PREVIEW KELUARGA DAN DATA PREVIEW PENDUDUK
  // ===========================================================================
  viewer: {
    management: {
      users: { view: false, create: false, edit: false, delete: false },
      announcements: { view: false, create: false, edit: false, delete: false },
    },
    database: {
      kk: { view: false, insert: false, edit: false, delete: false, copy: false },
      employment: { view: false, insert: false, edit: false, delete: false, copy: false },
      kesejahteraan: { view: false, insert: false, edit: false, delete: false, copy: false },
    },
    dataPreview: {
      penduduk: { view: true, edit: false, delete: false, copy: false, export: false },
      employment: { view: true, edit: false, delete: false, copy: false, export: false },
      kesejahteraan: { view: true, edit: false, delete: false, copy: false, export: false },
    },
    lokasiZona: {
      land: { view: true, insert: false, edit: false, delete: false, copy: false },
    },
  },
};

export function getRolePermissions(role) {
  // Default ke guest jika role tidak dikenali
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
}

// Helper untuk cek permission dengan cepat
// Contoh penggunaan: if (can(user.role, 'database', 'kk', 'insert')) { ... }
export function can(role, section, module, action) {
  const perms = getRolePermissions(role);
  return !!perms?.[section]?.[module]?.[action];
}