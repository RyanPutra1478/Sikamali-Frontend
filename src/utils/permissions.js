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
      kk: { view: true, insert: true, edit: true, delete: false, copy: true, export: false },
      employment: { view: true, insert: true, edit: true, delete: false, copy: true, export: false },
      kesejahteraan: { view: true, insert: true, edit: true, delete: false, copy: true, export: false },
    },
    dataPreview: {
      penduduk: { view: true, edit: true, delete: true, copy: true, export: false },
      employment: { view: true, edit: true, delete: true, copy: true, export: false },
      kesejahteraan: { view: true, edit: true, delete: true, copy: true, export: false },
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
      // Create Only. View needed to access form. Edit/Delete/Copy = FALSE.
      kk: { view: true, insert: true, edit: false, delete: false, copy: false },
      employment: { view: true, insert: true, edit: false, delete: false, copy: false },
      kesejahteraan: { view: true, insert: true, edit: false, delete: false, copy: false },
    },
    dataPreview: {
      // View Only
      penduduk: { view: true, edit: false, delete: false, copy: false, export: false },
      employment: { view: true, edit: false, delete: false, copy: false, export: false },
      kesejahteraan: { view: true, edit: false, delete: false, copy: false, export: false },
    },
    lokasiZona: {
      // Access terbatas ke Lokasi dan Domisili (Insert Record saja)
      // View true otherwise they can't see the map to insert? Use view: true
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