import React, { useState } from 'react';
import { authAPI } from '../services/api';
import './AuthForm.css';

export default function AuthForm({ onAuth }) {
        const [isLogin, setIsLogin] = useState(true);
        const [username, setUsername] = useState('');
        const [password, setPassword] = useState('');
        const [showPassword, setShowPassword] = useState(false);
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (e) => {
                e.preventDefault();
                setError('');
                setLoading(true);

                try {
                        if (isLogin) {
                                const data = await authAPI.login({ username, password });
                                localStorage.setItem('token', data.token);
                                localStorage.setItem('refreshToken', data.refreshToken);
                                localStorage.setItem('user', JSON.stringify(data.user));
                                onAuth(data);
                        } else {
                                await authAPI.register(username, password);
                                setError('');
                                alert('Registrasi berhasil! Silakan login.');
                                setIsLogin(true);
                                setUsername('');
                                setPassword('');
                        }
                } catch (err) {
                        setError(err.message || 'Gagal login.');
                } finally {
                        setLoading(false);
                }
        };

        return (
                <div className="auth-container">
                        <div className="auth-form">
                                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <img 
                                                src="/logo-icon.png" 
                                                alt="Sikamali Logo" 
                                                style={{ 
                                                        width: '80px', 
                                                        height: 'auto', 
                                                        background: 'rgba(255, 255, 255, 0.9)', 
                                                        borderRadius: '16px', 
                                                        padding: '8px',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                                        marginBottom: '1rem'
                                                }} 
                                        />
                                        <h1 style={{ 
                                                color: 'white', 
                                                fontSize: '1.25rem', 
                                                fontWeight: 'bold', 
                                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                lineHeight: '1.4',
                                                margin: 0
                                        }}>
                                                Sistem Informasi Kependudukan<br/>Lingkar Tambang
                                        </h1>
                                </div>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{isLogin ? 'Login' : 'Buat Akun'}</h2>
                                <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                                <label>Username</label>
                                                <input
                                                        type="text"
                                                        placeholder="Username"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        required
                                                        disabled={loading}
                                                />
                                        </div>

                                        <div className="form-group">
                                                <label>Password</label>
                                                <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                                        <input
                                                                type={showPassword ? "text" : "password"}
                                                                placeholder="Password"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                required
                                                                disabled={loading}
                                                                style={{ width: '100%', paddingRight: '40px' }}
                                                        />
                                                        <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                style={{
                                                                        position: 'absolute',
                                                                        right: '10px',
                                                                        top: '50%',
                                                                        transform: 'translateY(-50%)',
                                                                        background: 'none',
                                                                        border: 'none',
                                                                        cursor: 'pointer',
                                                                        fontSize: '1.2rem'
                                                                }}
                                                        >
                                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                                        </button>
                                                </div>
                                                <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
                                                        Lupa Password? <a href="#" onClick={(e) => { e.preventDefault(); alert('Silakan hubungi Super Admin untuk reset password.'); }} style={{ color: '#007bff', textDecoration: 'none' }}>Hubungi Super Admin</a>
                                                </div>
                                        </div>

                                        <button type="submit" disabled={loading} className="btn-primary">
                                                {loading ? 'Memproses...' : (isLogin ? 'Login' : 'Daftar')}
                                        </button>
                                </form>

                                {error && <div className="error-message">{error}</div>}
                        </div>
                </div>
        );
}