import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './staffsettings.css';

const StaffSettings = () => {
    // --- STATE MANAGEMENT FOR PREFERENCES ---
    // POS Operations
    const [autoPrint, setAutoPrint] = useState(true);
    const [quickCash, setQuickCash] = useState(true);
    const [menuView, setMenuView] = useState('Grid View (Images)');

    // Accessibility & Alerts
    const [audioAlerts, setAudioAlerts] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [theme, setTheme] = useState('Dark Mode (Default)');

    // --- FUNCTIONAL EFFECTS ---
    // Apply High Contrast Mode to the entire app when toggled
    useEffect(() => {
        if (highContrast) {
            document.body.classList.add('high-contrast-mode');
        } else {
            document.body.classList.remove('high-contrast-mode');
        }
    }, [highContrast]);

    // Apply Light/Dark Theme to the entire app when changed
    useEffect(() => {
        if (theme === 'Light Mode') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="top-header">
                    <h1>Account Settings ⚙️</h1>
                </header>

                <div className="dashboard-layout-grid">
                    
                    {/* Left Column: Read-Only Account Info & Support (LOCKED) */}
                    <div className="left-column">
                        <div className="widget">
                            <h2 style={{color: "var(--text-accent)", marginBottom: "10px"}}>Account Profile</h2>
                            
                            <div style={{ backgroundColor: "rgba(255, 193, 7, 0.1)", borderLeft: "4px solid #ffc107", padding: "10px 15px", marginBottom: "20px", borderRadius: "4px" }}>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                    🔒 <strong>Locked:</strong> For security purposes, profile details and PIN changes are managed by the Administrator. Please contact management to request updates.
                                </p>
                            </div>

                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" className="form-input" defaultValue="Jhillian" disabled />
                            </div>
                            <div className="form-group" style={{marginTop: "15px"}}>
                                <label>Staff ID</label>
                                <input type="text" className="form-input" defaultValue="EMP-2024-042" disabled />
                            </div>
                            <div className="form-group" style={{marginTop: "15px"}}>
                                <label>Contact Number</label>
                                <input type="text" className="form-input" defaultValue="+63 999 888 7777" disabled />
                            </div>
                            <div className="form-group" style={{marginTop: "15px"}}>
                                <label>Assigned Role</label>
                                <input type="text" className="form-input" defaultValue="Cashier / Barista" disabled />
                            </div>
                        </div>

                        <div className="widget">
                            <h2 style={{color: "var(--text-accent)", marginBottom: "15px"}}>Need Help?</h2>
                            <p className="text-muted" style={{fontSize: "0.9rem", marginBottom: "15px"}}>
                                If you forgot your PIN or need to update your contact information, please reach out to your shift manager or system admin.
                            </p>
                            <button className="modal-action-btn outline" style={{width: "100%", padding: "10px"}} onClick={() => alert("Request sent to Admin!")}>
                                ✉️ Send Request to Admin
                            </button>
                        </div>
                    </div>

                    {/* Right Column: App & POS Preferences (FUNCTIONAL) */}
                    <div className="right-column">
                        
                        {/* POS Operations Widget */}
                        <div className="widget" style={{marginBottom: "20px"}}>
                            <h2 style={{color: "var(--text-accent)", marginBottom: "20px"}}>POS Operations</h2>
                            
                            <div className="preference-item">
                                <div>
                                    <strong>Auto-Print Receipts</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Automatically print after a successful transaction.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={autoPrint} 
                                        onChange={(e) => setAutoPrint(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item">
                                <div>
                                    <strong>Quick-Cash Suggestions</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Show exact amount and common bills at checkout.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={quickCash} 
                                        onChange={(e) => setQuickCash(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item" style={{borderBottom: "none"}}>
                                <div>
                                    <strong>Default Menu View</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Choose how items are displayed on the POS.</p>
                                </div>
                                <select 
                                    className="form-input" 
                                    style={{width: "auto", padding: "5px 10px"}}
                                    value={menuView}
                                    onChange={(e) => setMenuView(e.target.value)}
                                >
                                    <option value="Grid View (Images)">Grid View (Images)</option>
                                    <option value="List View (Text)">List View (Text)</option>
                                </select>
                            </div>
                        </div>

                        {/* Accessibility & Alerts Widget */}
                        <div className="widget">
                            <h2 style={{color: "var(--text-accent)", marginBottom: "20px"}}>Accessibility & Alerts</h2>
                            
                            <div className="preference-item">
                                <div>
                                    <strong>Low Stock Audio Alerts</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Play a chime when an inventory item becomes critical.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={audioAlerts} 
                                        onChange={(e) => setAudioAlerts(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item">
                                <div>
                                    <strong>High Contrast Mode</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Increase text visibility and button borders.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={highContrast} 
                                        onChange={(e) => setHighContrast(e.target.checked)} 
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item" style={{borderBottom: "none"}}>
                                <div>
                                    <strong>Interface Theme</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Switch between light and dark mode.</p>
                                </div>
                                <select 
                                    className="form-input" 
                                    style={{width: "auto", padding: "5px 10px"}}
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                >
                                    <option value="Dark Mode (Default)">Dark Mode (Default)</option>
                                    <option value="Light Mode">Light Mode</option>
                                </select>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default StaffSettings;