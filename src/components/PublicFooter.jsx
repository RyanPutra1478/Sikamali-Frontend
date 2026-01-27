import React from 'react';

export default function PublicFooter() {
  return (
    <footer style={{ background: '#111827', color: 'white', padding: '4rem 2rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: '900', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <img 
              src="/logo-icon.png" 
              alt="Sikamali Logo" 
              style={{ 
                width: '32px', 
                height: '32px', 
                background: '#ffffff', 
                borderRadius: '8px', 
                padding: '4px'
              }} 
            />
            SIKAMALI
          </h3>
          <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>
            Website resmi Desa Sikamali. Memberikan pelayanan publik yang transparan, akuntabel, dan efisien.
          </p>
        </div>
        
        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#10b981' }}>Tautan Cepat</h4>
          <ul style={{ listStyle: 'none', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Profil Desa</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Struktur Pemerintahan</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Data Penduduk</a></li>
            <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Peta Wilayah</a></li>
          </ul>
        </div>
        
        <div>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#10b981' }}>Kontak</h4>
          <ul style={{ listStyle: 'none', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li>📍 Jl. Raya Sikamali No. 1</li>
            <li>📧 admin@sikamali.desa.id</li>
            <li>📞 (021) 1234-5678</li>
          </ul>
        </div>
      </div>
      
      <div style={{ borderTop: '1px solid #374151', marginTop: '3rem', paddingTop: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <p>&copy; {new Date().getFullYear()} Pemerintah Desa Sikamali. All rights reserved.</p>
      </div>
    </footer>
  );
}
