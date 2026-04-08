import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase.js'; 
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import './settingsadmin.css';

const SettingsAdmin = () => {
    const navigate = useNavigate();
    
    // --- REAL-TIME DATA STATES ---
    const [email, setEmail] = useState('Admin@clubc.com');
    const [phone, setPhone] = useState('+63 919 698 1234');
    const [theme, setTheme] = useState(localStorage.getItem('clubC_admin_theme') || 'dark');
    const [mlEnabled, setMlEnabled] = useState(true);
    
    // Added a state to track the actual password from the database
    const [currentDbPassword, setCurrentDbPassword] = useState('admin123');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'adminPrefs');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.email) setEmail(data.email);
                    if (data.phone) setPhone(data.phone);
                    if (data.mlEnabled !== undefined) setMlEnabled(data.mlEnabled);
                    if (data.password) setCurrentDbPassword(data.password);
                } else {
                    // Create the document with defaults if it doesn't exist yet
                    await setDoc(docRef, {
                        email: 'Admin@clubc.com',
                        phone: '+63 919 698 1234',
                        mlEnabled: true,
                        password: 'admin' 
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        localStorage.setItem('clubC_admin_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleToggleML = async () => {
        const newState = !mlEnabled;
        setMlEnabled(newState);
        await setDoc(doc(db, 'settings', 'adminPrefs'), { mlEnabled: newState }, { merge: true });
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); 
    const [inputValue, setInputValue] = useState('');
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    const handleNavigation = (path) => navigate(path);

    const openModal = (type) => {
        setModalType(type);
        if (type === 'email') setInputValue(email);
        else if (type === 'phone') setInputValue(phone);
        else setInputValue('');
        
        setPasswordData({ current: '', new: '', confirm: '' });
        setIsModalOpen(true);
    };

    const handleSaveModal = async () => {
        try {
            const docRef = doc(db, 'settings', 'adminPrefs');

            if (modalType === 'email') {
                setEmail(inputValue);
                await setDoc(docRef, { email: inputValue }, { merge: true });
                alert(`Notice: Admin email changed to ${inputValue}`);
            } 
            else if (modalType === 'phone') {
                setPhone(inputValue);
                await setDoc(docRef, { phone: inputValue }, { merge: true });
                alert(`Notice: Admin phone changed to ${inputValue}`);
            } 
            else if (modalType === 'password') {
                if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
                    return alert("Please fill out all password fields.");
                }
                if (passwordData.current !== currentDbPassword) {
                    return alert("Incorrect current password!");
                }
                if (passwordData.new !== passwordData.confirm) {
                    return alert("New passwords do not match!");
                }
                
                // Save the new password to Firebase and update local state
                await setDoc(docRef, { password: passwordData.new }, { merge: true });
                setCurrentDbPassword(passwordData.new);
                alert("Password successfully updated! Use this to log in next time.");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving:", error);
            alert("Failed to save settings.");
        }
    };

    const handleDeviceLogout = () => {
        if (window.confirm("Are you sure you want to log out of Chrome on Windows?")) {
            alert("Device successfully unlinked. You will be logged out.");
            navigate('/');
        }
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ color: 'var(--text-accent)', margin: '20px 0', fontSize: '24px', letterSpacing: '1px' }}>CLUB C.</h2>
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
                <header className="page-header">
                    <div className="header-titles">
                        <h1>Settings</h1>
                        <p>Manage your account, preferences, and interface.</p>
                    </div>
                    <div className="header-actions">
                        <div className="user-info">
                            <span className="bell-icon" style={{cursor: 'pointer'}} onClick={() => alert("No new notifications")}>🔔</span>
                            <span className="user-name">Admin 👤</span>
                        </div>
                    </div>
                </header>

                <h2 className="settings-section-title">Account Settings</h2>

                <div className="settings-grid">
                    <div className="settings-left-col">
                        <div className="widget flex-row">
                            <div className="settings-info">
                                <h3>Email Address</h3>
                                <p>{email}</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('email')}>Update</button>
                        </div>

                        <div className="widget flex-row">
                            <div className="settings-info">
                                <h3>Phone Number</h3>
                                <p>{phone}</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('phone')}>Update</button>
                        </div>

                        <div className="widget flex-row">
                            <div className="settings-info">
                                <h3>Password</h3>
                                <p>**********</p>
                            </div>
                            <button className="settings-btn" onClick={() => openModal('password')}>Change</button>
                        </div>

                        <div className="widget center-content">
                            <h3>Contact Support</h3>
                            <p style={{marginBottom: '15px'}}>Need more help? Send us a message for support</p>
                            <button className="settings-btn outline-btn" onClick={() => window.location.href = "mailto:support@clubc.com"}>Contact Us</button>
                        </div>
                    </div>

                    <div className="settings-right-col">
                        <div className="widget">
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

                        <div className="widget">
                            <h3>Preferences</h3>
                            <div className="toggle-row mt-15">
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={mlEnabled} 
                                        onChange={handleToggleML} 
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <div className="toggle-info">
                                    <strong>Enable Machine Learning Features</strong>
                                    <p>Turn Off to disable machine learning insights & auto-reorder suggestions</p>
                                </div>
                            </div>
                        </div>

                        <div className="widget">
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
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h2>
                            {modalType === 'email' && "Update Email Address"}
                            {modalType === 'phone' && "Update Phone Number"}
                            {modalType === 'password' && "Change Password"}
                            {modalType === 'device' && "Manage Device"}
                        </h2>
                        
                        {(modalType === 'email' || modalType === 'phone') && (
                            <div className="form-group">
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
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input 
                                        type="password" 
                                        value={passwordData.current}
                                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input 
                                        type="password" 
                                        value={passwordData.new}
                                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div className="form-group">
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

                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            {modalType !== 'device' && (
                                <button className="save-btn" onClick={handleSaveModal}>Save Changes</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsAdmin;