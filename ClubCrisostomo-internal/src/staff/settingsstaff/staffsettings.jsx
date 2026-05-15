import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './staffsettings.css';

const StaffSettings = () => {
    // --- STATE MANAGEMENT WITH LOCAL STORAGE PERSISTENCE ---
    
    // 1. POS Workflow Settings
    // Defaults to true, so we check if it is explicitly NOT 'false'
    const [autoPrint, setAutoPrint] = useState(localStorage.getItem('staff_autoPrint') !== 'false');
    const [quickCash, setQuickCash] = useState(localStorage.getItem('staff_quickCash') !== 'false');
    const [menuView, setMenuView] = useState(localStorage.getItem('pos_menu_view') || 'Grid View (Images)');

    // 2. Accessibility & Alerts Settings
    // Defaults to false, so we check if it strictly equals 'true'
    const [audioAlerts, setAudioAlerts] = useState(localStorage.getItem('staff_audioAlerts') === 'true');
    const [highContrast, setHighContrast] = useState(localStorage.getItem('staff_highContrast') === 'true');
    const [theme, setTheme] = useState(localStorage.getItem('staff_theme') || 'Dark Mode (Default)');

    // 3. Health & Ergonomics Settings
    const [stretchReminders, setStretchReminders] = useState(localStorage.getItem('staff_stretchReminders') === 'true');
    const [eyeCareMode, setEyeCareMode] = useState(localStorage.getItem('staff_eyeCareMode') === 'true');
    const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('staff_reduceMotion') === 'true');

    // Dummy Staff Data
    const staffName = localStorage.getItem("userName") || "Staff Member";
    const staffRole = "Cashier / Barista";
    const staffId = "EMP-2024-042";

    // --- FUNCTIONAL EFFECTS (APPLY & SAVE SETTINGS) ---
    
    // POS Workflow Savers
    useEffect(() => { localStorage.setItem('staff_autoPrint', autoPrint); }, [autoPrint]);
    useEffect(() => { localStorage.setItem('staff_quickCash', quickCash); }, [quickCash]);
    useEffect(() => { localStorage.setItem('pos_menu_view', menuView); }, [menuView]);
    
    // Alert & Health Savers (No visual UI changes needed)
    useEffect(() => { localStorage.setItem('staff_audioAlerts', audioAlerts); }, [audioAlerts]);
    useEffect(() => { localStorage.setItem('staff_stretchReminders', stretchReminders); }, [stretchReminders]);

    // Apply High Contrast Mode & Save
    useEffect(() => {
        localStorage.setItem('staff_highContrast', highContrast);
        if (highContrast) {
            document.body.classList.add('high-contrast-mode');
        } else {
            document.body.classList.remove('high-contrast-mode');
        }
    }, [highContrast]);

    // Apply Light/Dark Theme & Save
    useEffect(() => {
        localStorage.setItem('staff_theme', theme);
        if (theme === 'Light Mode') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    // Apply Eye Care Mode & Save
    useEffect(() => {
        localStorage.setItem('staff_eyeCareMode', eyeCareMode);
        if (eyeCareMode) {
            document.body.classList.add('eye-care-mode');
        } else {
            document.body.classList.remove('eye-care-mode');
        }
    }, [eyeCareMode]);

    // Apply Reduce Motion & Save
    useEffect(() => {
        localStorage.setItem('staff_reduceMotion', reduceMotion);
        if (reduceMotion) {
            document.body.classList.add('reduce-motion');
        } else {
            document.body.classList.remove('reduce-motion');
        }
    }, [reduceMotion]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="top-header">
                    <h1>Staff Settings ⚙️</h1>
                </header>

                <div className="dashboard-layout-grid">
                    
                    {/* Left Column */}
                    <div className="left-column">
                        <div className="widget" style={{marginBottom: "20px"}}>
                            <h2 style={{color: "var(--text-accent)", marginBottom: "20px"}}>Health & Ergonomics 🌿</h2>
                            
                            <div className="preference-item">
                                <div>
                                    <strong>Posture & Stretch Reminders</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Receive a gentle pop-up reminder to stretch every 2 hours.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={stretchReminders} onChange={(e) => setStretchReminders(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item">
                                <div>
                                    <strong>Eye-Care Mode (Blue Light Filter)</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Applies a warm screen tint to reduce eye strain during long shifts.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={eyeCareMode} onChange={(e) => setEyeCareMode(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item" style={{borderBottom: "none"}}>
                                <div>
                                    <strong>Reduce UI Motion</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Disable sliding animations and transitions for motion sensitivity.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="widget">
                            <h2 style={{color: "var(--text-accent)", marginBottom: "15px"}}>Account Requests</h2>
                            <p className="text-muted" style={{fontSize: "0.9rem", marginBottom: "15px", lineHeight: "1.5"}}>
                                Need to update your <strong>Email</strong>, <strong>Password</strong>, or <strong>POS PIN</strong>? Submit a request to management.
                            </p>
                            <button className="modal-action-btn outline" style={{width: "100%", padding: "10px"}} onClick={() => alert("Credential change request sent to Admin!")}>
                                ✉️ Send Request to Admin
                            </button>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        <div className="widget" style={{marginBottom: "20px"}}>
                            <h2 style={{color: "var(--text-accent)", marginBottom: "20px"}}>POS Workflow</h2>
                            
                            <div className="preference-item">
                                <div>
                                    <strong>Auto-Print Receipts</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Automatically print after a successful transaction.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={autoPrint} onChange={(e) => setAutoPrint(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item">
                                <div>
                                    <strong>Quick-Cash Suggestions</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Show exact amount and common bills at checkout.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={quickCash} onChange={(e) => setQuickCash(e.target.checked)} />
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
                                    value={menuView}
                                    onChange={(e) => setMenuView(e.target.value)}
                                >
                                    <option value="Grid View (Images)">Grid View (Images)</option>
                                    <option value="List View (Text)">List View (Text)</option>
                                </select>
                            </div>
                        </div>

                        <div className="widget">
                            <h2 style={{color: "var(--text-accent)", marginBottom: "20px"}}>Accessibility & Alerts</h2>
                            
                            <div className="preference-item">
                                <div>
                                    <strong>Low Stock Audio Alerts</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Play a chime when an inventory item becomes critical.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={audioAlerts} onChange={(e) => setAudioAlerts(e.target.checked)} />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="preference-item">
                                <div>
                                    <strong>High Contrast Mode</strong>
                                    <p className="text-muted" style={{margin: "5px 0 0", fontSize: "0.85rem"}}>Increase text visibility and button borders.</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
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