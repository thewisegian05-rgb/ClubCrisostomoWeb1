import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import { db } from '../../firebase.js'; 
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'; 
import './attendance.css';

function AttendancePage() {
    // --- 1. CLOUD STATE & LIVE SYNC ---
    const [staffList, setStaffList] = useState([]);
    
    useEffect(() => {
        const staffCollection = collection(db, 'staff');
        const unsubscribe = onSnapshot(staffCollection, (snapshot) => {
            const staffData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setStaffList(staffData);
        });

        return () => unsubscribe();
    }, []);

    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [unlockedStaffId, setUnlockedStaffId] = useState(null); 
    const [pinInput, setPinInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Leave Form States
    const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);
    const [leaveType, setLeaveType] = useState('Emergency Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const selectedStaff = staffList.find(s => s.id === selectedStaffId) || staffList[0];
    const isUnlocked = selectedStaff && unlockedStaffId === selectedStaff.id;

    useEffect(() => {
        if (staffList.length > 0 && !selectedStaffId) {
            setSelectedStaffId(staffList[0].id);
        }
    }, [staffList, selectedStaffId]);

    const handleSelectStaff = (id) => {
        setSelectedStaffId(id);
        setPinInput('');
        setErrorMessage('');
        setSuccessMessage('');
        setIsLeaveFormOpen(false); 
    };

    const handleUnlockProfile = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (pinInput === selectedStaff.pin) {
            setUnlockedStaffId(selectedStaff.id);
            setPinInput(''); 
        } else {
            setErrorMessage('Incorrect PIN. Please try again.');
            setPinInput('');
        }
    };

    // --- 2. LEAVE REQUESTS (Updating Cloud) ---
    const handleLeaveSubmit = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            setErrorMessage("Please select both start and end dates.");
            return;
        }

        const staffRef = doc(db, 'staff', selectedStaff.id);
        await updateDoc(staffRef, {
            pendingRequest: { type: leaveType, start: startDate, end: endDate, status: 'Pending Admin Approval' }
        });

        setSuccessMessage(`Request sent to Admin for approval.`);
        setIsLeaveFormOpen(false);
        setStartDate(''); 
        setEndDate('');
    };

    // --- 3. CLOCK IN / OUT (Updating Cloud) ---
    const handleShiftAction = async (actionType) => {
        let newAction = '';
        let newStatus = '';
        const currentTime = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

        switch (actionType) {
            case 'clock_in': newAction = 'Clocked In'; newStatus = 'Active'; break;
            case 'clock_out': newAction = 'Off Shift'; newStatus = 'Inactive'; setUnlockedStaffId(null); break;
            case 'go_active': newAction = 'Clocked In'; newStatus = 'Active'; break;
            case 'go_break': newAction = 'On Break'; newStatus = 'On Break'; break;
            default: return;
        }

        let currentTimestamps = selectedStaff.timestamps || { clockIn: null, breakStart: null, breakEnd: null, clockOut: null };
        let newTimestamps = { ...currentTimestamps };

        if (actionType === 'clock_in') { newTimestamps = { clockIn: currentTime, breakStart: null, breakEnd: null, clockOut: null }; }
        else if (actionType === 'go_break') { newTimestamps.breakStart = currentTime; }
        else if (actionType === 'go_active') { newTimestamps.breakEnd = currentTime; }
        else if (actionType === 'clock_out') { newTimestamps.clockOut = currentTime; }

        const staffRef = doc(db, 'staff', selectedStaff.id);
        await updateDoc(staffRef, {
            currentAction: newAction,
            status: newStatus,
            timestamps: newTimestamps
        });

        setSuccessMessage(`Action recorded at ${currentTime}.`);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Active': return 'badge badge-active';
            case 'Inactive': return 'badge badge-inactive';
            case 'On Leave': return 'badge badge-leave';
            case 'On Break': return 'badge badge-break'; 
            default: return 'badge';
        }
    };

    const renderActionButtons = () => {
        if (!selectedStaff) return null;
        if (selectedStaff.currentAction === 'Off Shift' || selectedStaff.status === 'On Leave') {
            return <button className="action-btn action-btn-green" onClick={() => handleShiftAction('clock_in')}>⏱️ Clock In Now</button>;
        } else if (selectedStaff.currentAction === 'Clocked In') {
            return (
                <div className="action-button-group">
                    <button className="action-btn action-btn-orange" onClick={() => handleShiftAction('go_break')}>☕ Go On Break</button>
                    <button className="action-btn action-btn-red" onClick={() => handleShiftAction('clock_out')}>🚪 Clock Out</button>
                </div>
            );
        } else if (selectedStaff.currentAction === 'On Break') {
            return (
                <div className="action-button-group">
                    <button className="action-btn action-btn-active-gold" onClick={() => handleShiftAction('go_active')}>▶️ Resume Shift</button>
                    <button className="action-btn action-btn-red" onClick={() => handleShiftAction('clock_out')}>🚪 Clock Out</button>
                </div>
            );
        }
        return null;
    };

    const activeLogs = staffList.filter(staff => staff.timestamps && staff.timestamps.clockIn);

    return (
        <div className="attendance-page dark-theme">
            <Sidebar />
            <div className="main-content">
                <header className="page-header">
                    <h1>Attendance & Shift Management</h1>
                </header>

                {staffList.length === 0 ? (
                    <div style={{padding: '50px', textAlign: 'center', backgroundColor: '#222', borderRadius: '12px'}}>
                        <h2 style={{color: '#c8a27c'}}>No Staff Found in Database</h2>
                        <p style={{color: '#aaa'}}>Please add employees in the Admin Control Panel first.</p>
                    </div>
                ) : (
                <>
                    <section className="attendance-panels-row">
                        <div className="panel list-panel">
                            <div className="panel-header"><h2>Staff On Floor</h2></div>
                            <div className="staff-list">
                                <div className="list-header-row"><span>Name | Role</span><span>Status</span><span>Shift</span></div>
                                {staffList.map((staff) => (
                                    <div key={staff.id} className={`staff-list-item ${selectedStaff?.id === staff.id ? 'selected' : ''}`} onClick={() => handleSelectStaff(staff.id)}>
                                        <div className="staff-info-col"><div className="staff-initial">{staff.initial}</div><div className="staff-name-role"><strong>{staff.name}</strong><span className="staff-role-sub">{staff.role}</span></div></div>
                                        <div className="staff-status-col"><span className={getStatusBadgeClass(staff.status)}>{staff.status}</span></div>
                                        <div className="staff-shift-col">{staff.shift}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="panel action-panel">
                            <div className="panel-header"><h2>Action Panel</h2></div>
                            {selectedStaff && (
                            <div className="security-section card-dark">
                                {!isUnlocked ? (
                                    <form onSubmit={handleUnlockProfile} className="secure-shift-management" style={{textAlign: 'center'}}>
                                        <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>🔒</span>
                                        <h3 className="section-title-accent" style={{marginBottom: '5px'}}>Authorization Required</h3>
                                        <p style={{ color: 'var(--text-darker)', marginBottom: '20px', fontSize: '0.9rem' }}>Enter PIN for <strong>{selectedStaff.name}</strong>.</p>
                                        <input type="password" maxLength="4" placeholder="••••" className="secure-pin-input" style={{width: '100%', fontSize: '20px', textAlign: 'center', letterSpacing: '10px', padding: '10px', marginBottom: '10px'}} value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
                                        {errorMessage && <div className="error-msg">{errorMessage}</div>}
                                        <button type="submit" className="action-btn action-btn-active-gold" style={{marginTop: '10px'}}>Unlock Actions</button>
                                    </form>
                                ) : (
                                    <div className="secure-shift-management">
                                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                            <h3 className="section-title-accent" style={{margin: 0}}>Manage Shift</h3>
                                            <button onClick={() => { setUnlockedStaffId(null); setIsLeaveFormOpen(false); }} style={{background: 'transparent', border: 'none', color: 'var(--text-darker)', cursor: 'pointer', textDecoration: 'underline'}}>Lock Profile</button>
                                        </div>
                                        <p className="section-subtitle">Current Action: <strong style={{color: '#fff'}}>{selectedStaff.currentAction}</strong></p>
                                        {successMessage && <div className="success-msg">{successMessage}</div>}

                                        {!isLeaveFormOpen ? (
                                            <>
                                                <div className="verified-actions-container">{renderActionButtons()}</div>
                                                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                                                    <button className="action-btn" style={{ backgroundColor: '#444', color: '#e0e0e0' }} onClick={() => setIsLeaveFormOpen(true)}>📅 Request Leave / Absence</button>
                                                </div>
                                            </>
                                        ) : (
                                            <form onSubmit={handleLeaveSubmit} className="leave-form-container" style={{ marginTop: '10px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #444' }}>
                                                <p style={{ color: 'var(--accent-gold)', marginBottom: '15px', fontWeight: 'bold' }}>Submit Leave Request</p>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label style={{display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px'}}>Leave Type</label>
                                                    <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="secure-pin-input" style={{ letterSpacing: 'normal', fontSize: '14px', width: '100%', padding: '10px' }}>
                                                        <option>🚨 Emergency Leave</option><option>🤒 Sick Leave</option><option>👶 Solo Parent Leave</option><option>🏖️ Vacation Leave</option><option>🕊️ Bereavement</option>
                                                    </select>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                                    <div><label style={{display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px'}}>Start</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="secure-pin-input" style={{width: '100%', padding: '10px'}}/></div>
                                                    <div><label style={{display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px'}}>End</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="secure-pin-input" style={{width: '100%', padding: '10px'}}/></div>
                                                </div>
                                                <div className="action-button-group">
                                                    <button type="submit" className="action-btn action-btn-active-gold">Send Request</button>
                                                    <button type="button" className="action-btn action-btn-red" onClick={() => setIsLeaveFormOpen(false)}>Cancel</button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}
                            {/* Selected Staff Details */}
                            {selectedStaff && (
                            <div className="profile-detail-card card-dark" style={{marginTop: '20px'}}>
                                <div className="profile-header-center"><div className="profile-initial-lg">{selectedStaff.initial}</div><h2>{selectedStaff.name}</h2><span className="role-main-accent">{selectedStaff.role}</span></div>
                                {selectedStaff.pendingRequest && (
                                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(251, 192, 45, 0.1)', border: '1px solid #fbc02d', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ color: '#fbc02d', fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>⏳ Pending Admin Approval</div>
                                        <strong style={{ display: 'block', fontSize: '14px', color: '#fff' }}>{selectedStaff.pendingRequest.type}</strong>
                                        <span style={{ fontSize: '13px', color: '#aaa' }}>{selectedStaff.pendingRequest.start} to {selectedStaff.pendingRequest.end}</span>
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    </section>

                    {/* --- THE RESTORED LOGS PANEL --- */}
                    <section className="panel logs-panel card-dark" style={{marginTop: '20px'}}>
                        <div className="panel-header">
                            <h2>Today's Shift Logs</h2>
                        </div>
                        <div className="logs-table">
                            <div className="logs-header-row" style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr', padding: '10px 15px', color: 'var(--accent-gold)', fontWeight: 'bold', borderBottom: '1px solid #333'}}>
                                <span>Name</span>
                                <span>Clock In</span>
                                <span>Break</span>
                                <span>Clock Out</span>
                            </div>
                            
                            {activeLogs.length === 0 ? (
                                <div className="empty-logs" style={{padding: '30px', textAlign: 'center', color: '#888', fontStyle: 'italic'}}>No staff have clocked in today yet.</div>
                            ) : (
                                activeLogs.map((staff) => {
                                    const t = staff.timestamps;
                                    let breakDisplay = '--';
                                    if (t.breakStart) {
                                        breakDisplay = t.breakEnd ? `${t.breakStart} - ${t.breakEnd}` : `${t.breakStart} - `;
                                    }

                                    return (
                                        <div key={staff.id} className="logs-row" style={{display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr 1fr', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center'}}>
                                            <strong>{staff.name}</strong>
                                            <span>{t.clockIn || '--'}</span>
                                            <span style={{color: t.breakStart && !t.breakEnd ? '#fbc02d' : 'inherit'}}>{breakDisplay}</span>
                                            <span style={{color: t.clockOut ? '#f44336' : 'inherit'}}>{t.clockOut || '--'}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </>
                )}
            </div>
        </div>
    );
}

export default AttendancePage;