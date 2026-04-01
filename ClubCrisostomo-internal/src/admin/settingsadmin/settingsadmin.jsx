import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './settingsadmin.css';

const SettingsAdmin = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [email, setEmail] = useState(() => localStorage.getItem('clubC_admin_email') || 'Admin@gmail.com');
    const [phone, setPhone] = useState(() => localStorage.getItem('clubC_admin_phone') || '+63 919 698 1234');
    
    const [theme, setTheme] = useState(() => localStorage.getItem('clubC_admin_theme') || 'dark');
    const [mlEnabled, setMlEnabled] = useState(() => {
        const saved = localStorage.getItem('clubC_admin_ml');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); 
    const [inputValue, setInputValue] = useState('');
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    useEffect(() => {
        localStorage.setItem('clubC_admin_theme', theme);
        // This applies the theme to the entire website body
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('clubC_admin_ml', JSON.stringify(mlEnabled));
    }, [mlEnabled]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const openModal = (type) => {
        setModalType(type);
        if (type === 'email') setInputValue(email);
        else if (type === 'phone') setInputValue(phone);
        else setInputValue('');
        
        setPasswordData({ current: '', new: '', confirm: '' });
        setIsModalOpen(true);
    };

    const handleSaveModal = () => {
        if (modalType === 'email') {
            setEmail(inputValue);
            localStorage.setItem('clubC_admin_email', inputValue);
            alert(`Email updated! You must now use ${inputValue} to log in.`);
        } 
        else if (modalType === 'phone') {
            setPhone(inputValue);
            localStorage.setItem('clubC_admin_phone', inputValue);
        } 
        else if (modalType === 'password') {
            // --- SECURITY CHECK: Get the actual current password ---
            const savedPass = localStorage.getItem('clubC_admin_password') || "1234";

            if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
                alert("Please fill out all password fields.");
                return;
            }
            // --- SECURITY CHECK: Does it match? ---
            if (passwordData.current !== savedPass) {
                alert("Incorrect current password! Please try again.");
                return;
            }
            if (passwordData.new !== passwordData.confirm) {
                alert("New passwords do not match!");
                return;
            }
            
            localStorage.setItem('clubC_admin_password', passwordData.new);
            alert("Password successfully updated! Use this to log in next time.");
        }
        setIsModalOpen(false);
    };

    const handleDeviceLogout = () => {
        if (window.confirm("Are you sure you want to log out of Chrome on Windows?")) {
            alert("Device successfully unlinked.");
            setIsModalOpen(false);
        }
    };

    const handleContactUs = () => {
        window.location.href = "mailto:support@clubc.com?subject=Admin Support Request";
    };

    return (
        <div className="dashboard-container settings-wrapper">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => handleNavigation('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li onClick={() => handleNavigation('/admin/inventory')}><span className="icon">📦</span> Inventory</li>
                        <li onClick={() => handleNavigation('/admin/menu')}><span className="icon">☕</span> Menu</li>
                        <li onClick={() => handleNavigation('/admin/staffs-management')}><span className="icon">👥</span> Staff</li>
                        <li onClick={() => handleNavigation('/admin/reports')}><span className="icon">📊</span> Reports</li>
                        <li className="active"><span className="icon">⚙️</span> Settings</li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
            </aside>

            <main className="main-content">
                <header className="settings-header">
                    <h1>Settings</h1>
                    <div className="user-info">
                        <span className="bell-icon" style={{cursor: 'pointer'}} onClick={() => alert("No new notifications")}>🔔</span>
                        <span className="user-name">Admin 👤</span>
                    </div>
                </header>

                <h2 className="settings-section-title">Account Settings</h2>

                <div className="settings-grid">
                    <div className="settings-left-col">
                        <div className="settings-card flex-row">
                            <div className="settings-info">
                                <h3>Email Address</h3>
                                <p>{email}</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('email')}>Update</button>
                        </div>

                        <div className="settings-card flex-row">
                            <div className="settings-info">
                                <h3>Phone Number</h3>
                                <p>{phone}</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('phone')}>Update</button>
                        </div>

                        <div className="settings-card flex-row">
                            <div className="settings-info">
                                <h3>Password</h3>
                                <p>**********</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('password')}>Change</button>
                        </div>

                        <div className="settings-card center-content">
                            <h3>Contact Support</h3>
                            <p>Need more help? Send us a message for support</p>
                            <button className="settings-btn outline-btn mt-15" onClick={handleContactUs}>Contact Us</button>
                        </div>
                    </div>

                    <div className="settings-right-col">
                        <div className="settings-card">
                            <h3>User Interface</h3>
                            <p className="sub-label">Appearance</p>
                            
                            <div className="theme-options">
                                <label className="radio-container">
                                    <input 
                                        type="radio" 
                                        name="theme" 
                                        value="light" 
                                        checked={theme === 'light'} 
                                        onChange={() => setTheme('light')} 
                                    />
                                    <span className="radio-custom"></span>
                                    Light
                                </label>
                                <label className="radio-container">
                                    <input 
                                        type="radio" 
                                        name="theme" 
                                        value="dark" 
                                        checked={theme === 'dark'} 
                                        onChange={() => setTheme('dark')} 
                                    />
                                    <span className="radio-custom"></span>
                                    Dark
                                </label>
                            </div>
                        </div>

                        <div className="settings-card">
                            <h3>Preferences</h3>
                            <div className="toggle-row mt-15">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={mlEnabled} 
                                        onChange={() => setMlEnabled(!mlEnabled)} 
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <div className="toggle-info">
                                    <strong>Enable Machine Learning Features</strong>
                                    <p>Turn Off to disable machine learning insights & auto-reorder suggestions</p>
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <h3>Logged Device</h3>
                            <div className="device-info mt-15">
                                <p>Last Active: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p>Batangas, Philippines</p>
                                <p className="device-name mt-10">Chrome on Windows</p>
                            </div>
                            <button className="settings-btn float-right mt-negative" onClick={() => openModal('device')}>Manage Device</button>
                        </div>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="settings-modal-overlay">
                    <div className="settings-custom-modal">
                        <h2>
                            {modalType === 'email' && "Update Email Address"}
                            {modalType === 'phone' && "Update Phone Number"}
                            {modalType === 'password' && "Change Password"}
                            {modalType === 'device' && "Manage Device"}
                        </h2>
                        
                        {(modalType === 'email' || modalType === 'phone') && (
                            <div className="settings-form-group">
                                <label>New {modalType === 'email' ? 'Email' : 'Phone Number'}</label>
                                <input 
                                    type={modalType === 'email' ? 'email' : 'text'}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={`Enter new ${modalType}`}
                                    autoFocus
                                />
                            </div>
                        )}

                        {modalType === 'password' && (
                            <>
                                <div className="settings-form-group">
                                    <label>Current Password</label>
                                    <input 
                                        type="password" 
                                        value={passwordData.current}
                                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="settings-form-group">
                                    <label>New Password</label>
                                    <input 
                                        type="password" 
                                        value={passwordData.new}
                                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="settings-form-group">
                                    <label>Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={passwordData.confirm}
                                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </>
                        )}

                        {modalType === 'device' && (
                            <div className="device-modal-info">
                                <p style={{color: 'var(--text-main)', marginBottom: '15px'}}><strong>Chrome on Windows</strong> is currently logged into this admin account.</p>
                                <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px'}}>If you do not recognize this device, you should log out immediately and change your password.</p>
                                
                                <button 
                                    style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(239, 83, 80, 0.1)', color: '#ef5350', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                                    onClick={handleDeviceLogout}
                                >
                                    Log Out of This Device
                                </button>
                            </div>
                        )}

                        <div className="settings-modal-actions">
                            <button className="settings-cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            {modalType !== 'device' && (
                                <button className="settings-save-btn" onClick={handleSaveModal}>Save Changes</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsAdmin;