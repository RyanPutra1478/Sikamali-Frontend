import React from 'react';
import '../pages/AdminPage.css'; // Reuse existing styles

export default function FilterComponent({ filters, onFilterChange, categories }) {
    // categories: [{ label: 'Umur', value: 'umur', type: 'range' }, { label: 'Desa', value: 'desa', type: 'dropdown', options: [] }, ...]

    return (
        <div className="filter-container" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            {categories.map((cat) => (
                <div key={cat.value} className="filter-item">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{cat.label}</label>

                    {cat.type === 'dropdown' && (
                        <select
                            value={filters[cat.value] || ''}
                            onChange={(e) => onFilterChange(cat.value, e.target.value)}
                            className="form-control"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value="">Semua</option>
                            {cat.options.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    )}

                    {cat.type === 'range' && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="number"
                                placeholder="Min"
                                value={filters[`${cat.value}_min`] || ''}
                                onChange={(e) => onFilterChange(`${cat.value}_min`, e.target.value)}
                                style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={filters[`${cat.value}_max`] || ''}
                                onChange={(e) => onFilterChange(`${cat.value}_max`, e.target.value)}
                                style={{ width: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
