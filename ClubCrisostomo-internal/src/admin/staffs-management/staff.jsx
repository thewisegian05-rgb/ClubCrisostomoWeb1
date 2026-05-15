import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase.js'; 
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import './staff.css';

const Staff = () => {
    const navigate = useNavigate();
    
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

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStaff, setSelectedStaff] = useState(null); 
    
    useEffect(() => {
        if (selectedStaff && staffList.length > 0) {
            const updatedSelected = staffList.find(s => s.id === selectedStaff.id);
            if (updatedSelected) setSelectedStaff(updatedSelected);
        } else if (!selectedStaff && staffList.length > 0) {
            setSelectedStaff(staffList[0]);
        }
    }, [staffList]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showPassword, setShowPassword] = useState(false); 
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All'); 

    // Default form state
    const [formData, setFormData] = useState({
        name: '', role: 'Cashier', status: 'Inactive', shift: '', phone: '', email: '', password: '', dayOff: '', pin: '', hourlyRate: ''
    });

    // --- 2. LEAVE APPROVALS ---
    const pendingRequests = staffList.filter(staff => staff.pendingRequest);

    const handleLeaveDecision = async (staffId, decision) => {
        const staffRef = doc(db, 'staff', staffId);
        const staffInfo = staffList.find(s => s.id === staffId);

        if (decision === 'approve') {
            await setDoc(staffRef, {
                ...staffInfo,
                status: 'On Leave',
                currentAction: `Approved Leave: ${staffInfo.pendingRequest.type}`,
                pendingRequest: null
            }, { merge: true }); 
        } else if (decision === 'deny') {
            await setDoc(staffRef, { ...staffInfo, pendingRequest: null }, { merge: true });
        }
    };

    // --- 3. CRUD OPERATIONS ---
    const handleAddClick = () => {
        setEditingStaff(null);
        setFormData({ name: '', role: 'Cashier', status: 'Inactive', shift: '', phone: '', email: '', password: '', dayOff: '', pin: '', hourlyRate: '' });
        setShowPassword(false); 
        setIsModalOpen(true);
    };

    const handleEditClick = (staff, e) => {
        if (e) e.stopPropagation(); 
        setEditingStaff(staff);
        setFormData({ ...staff });
        setShowPassword(false); 
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm("Are you sure you want to completely remove this staff member?")) {
            await deleteDoc(doc(db, 'staff', id)); 
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const staffInitial = formData.name ? formData.name.charAt(0).toUpperCase() : '?';
        
        // Ensure hourlyRate is saved as a number
        const parsedHourlyRate = parseFloat(formData.hourlyRate) || 0;

        if (editingStaff) {
            await setDoc(doc(db, 'staff', editingStaff.id), {
                ...formData,
                hourlyRate: parsedHourlyRate,
                initial: staffInitial,
                currentAction: editingStaff.currentAction || 'Off Shift',
                timestamps: editingStaff.timestamps || {}
            }, { merge: true });
        } else {
            const newId = `STF${Math.floor(1000 + Math.random() * 9000)}`;
            await setDoc(doc(db, 'staff', newId), {
                ...formData,
                hourlyRate: parsedHourlyRate,
                totalHours: 0, // Automatically start a new employee with 0 hours
                initial: staffInitial,
                currentAction: 'Off Shift',
                pendingRequest: null
            });
        }
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- 4. CALCULATIONS ---
    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              staff.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || staff.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = staffList.filter(s => s.status === 'Active').length;
    const onBreakCount = staffList.filter(s => s.status === 'On Break').length;
    const inactiveCount = staffList.filter(s => s.status === 'Inactive').length;
    const onLeaveCount = staffList.filter(s => s.status === 'On Leave').length;
    const getStatusClass = (status) => status ? status.toLowerCase().replace(' ', '-') : 'inactive';

    return (
        <div className="dashboard-container">
            {/* --- ADMIN SIDEBAR --- */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ color: 'var(--text-accent)', margin: '20px 0', fontSize: '24px', letterSpacing: '1px' }}>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => navigate('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li onClick={() => navigate('/admin/inventory')}><span className="icon">📦</span> Inventory</li>
                        <li onClick={() => navigate('/admin/menu')}><span className="icon">☕</span> Menu</li>
                        <li className="active"><span className="icon">👥</span> Staff</li>
                        <li onClick={() => navigate('/admin/reports')}><span className="icon">📊</span> Reports</li>
                        <li onClick={() => navigate('/admin/settingsadmin')}><span className="icon">⚙️</span> Settings</li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => navigate('/')}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="page-header">
                    <div className="header-titles">
                        <h1>Staff & Roster Management</h1>
                        <p>Manage employees, passwords, and shift requests.</p>
                    </div>
                    
                    <div className="header-actions">
                        <div className="search-bar">
                            <span className="search-icon"></span>
                            <input 
                                type="text" 
                                placeholder="Search staff..." 
                                className="search-input"
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <button className="add-btn" onClick={handleAddClick}>
                            + Add Employee
                        </button>
                    </div>
                </header>

                {/* METRICS */}
                <div className="metrics-grid" style={{gridTemplateColumns: 'repeat(5, 1fr)'}}>
                    <div className="metric-card"><span className="metric-title"><span className="dot dot-grey"></span> Total Staff</span><span className="metric-value">{staffList.length}</span></div>
                    <div className="metric-card"><span className="metric-title"><span className="dot dot-green"></span> Active</span><span className="metric-value metric-value-green">{activeCount}</span></div>
                    <div className="metric-card"><span className="metric-title"><span className="dot" style={{backgroundColor: '#fbc02d'}}></span> On Break</span><span className="metric-value" style={{color: '#fbc02d'}}>{onBreakCount}</span></div>
                    <div className="metric-card"><span className="metric-title"><span className="dot dot-red"></span> Inactive</span><span className="metric-value metric-value-red">{inactiveCount}</span></div>
                    <div className="metric-card"><span className="metric-title"><span className="dot" style={{backgroundColor: '#ff9800'}}></span> On Leave</span><span className="metric-value" style={{color: '#ff9800'}}>{onLeaveCount}</span></div>
                </div>

                {/* PENDING APPROVALS */}
                {pendingRequests.length > 0 && (
                    <section className="panel" style={{marginBottom: '30px', border: '1px solid #fbc02d', backgroundColor: 'var(--widget-dark)'}}>
                        <div className="panel-header"><h2 style={{color: '#fbc02d'}}>⚠️ Pending Leave Approvals ({pendingRequests.length})</h2></div>
                        <div style={{display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px'}}>
                            {pendingRequests.map(staff => (
                                <div key={`req-${staff.id}`} className="card-dark" style={{minWidth: '300px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px'}}>
                                        <div><strong style={{color: 'var(--white)', display: 'block'}}>{staff.name}</strong><span style={{fontSize: '12px', color: 'var(--text-muted)'}}>{staff.role}</span></div>
                                        <span className="badge" style={{backgroundColor: 'rgba(251, 192, 45, 0.2)', color: '#fbc02d', border: '1px solid #fbc02d'}}>Pending</span>
                                    </div>
                                    <p style={{color: 'var(--text-accent)', fontWeight: 'bold', margin: '0 0 5px 0'}}>{staff.pendingRequest.type}</p>
                                    <p style={{fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 15px 0'}}>📅 {staff.pendingRequest.start} to {staff.pendingRequest.end}</p>
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                                        <button className="action-btn action-btn-green" onClick={() => handleLeaveDecision(staff.id, 'approve')}>✓ Approve</button>
                                        <button className="action-btn action-btn-red" onClick={() => handleLeaveDecision(staff.id, 'deny')}>✕ Deny</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* PANELS */}
                <div className="attendance-panels-row">
                    <div className="panel list-panel">
                        <div className="panel-header">
                            <h2>Master Roster</h2>
                            <div style={{position: 'relative'}}>
                                <button className="filter-btn" onClick={() => setIsFilterOpen(!isFilterOpen)}>{statusFilter === 'All' ? 'Filter Status' : statusFilter} ▼</button>
                                {isFilterOpen && (
                                    <div className="filter-dropdown-menu">
                                        {['All', 'Active', 'On Break', 'Inactive', 'On Leave'].map(status => (
                                            <div key={status} className={statusFilter === status ? 'active-item' : ''} onClick={() => { setStatusFilter(status); setIsFilterOpen(false); }}>{status}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="staff-list">
                            <div className="list-header-row" style={{gridTemplateColumns: '2fr 1fr 1.5fr 1fr'}}>
                                <span>Name | Role</span><span>Status</span><span>Action</span><span style={{textAlign: 'right'}}>Manage</span>
                            </div>
                            {filteredStaff.length === 0 ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>No staff found. Add one above!</div>
                            ) : (
                                filteredStaff.map((staff) => (
                                    <div key={staff.id} className={`staff-list-item ${selectedStaff?.id === staff.id ? 'selected' : ''}`} style={{gridTemplateColumns: '2fr 1fr 1.5fr 1fr'}} onClick={() => setSelectedStaff(staff)}>
                                        <div className="staff-info-col"><div className="staff-initial">{staff.initial}</div><div className="staff-name-role"><strong>{staff.name}</strong><span className="staff-role-sub">{staff.role}</span></div></div>
                                        <div className="staff-status-col"><span className={`badge badge-${getStatusClass(staff.status)}`}>{staff.status}</span></div>
                                        <div className="staff-shift-col" style={{color: staff.status === 'On Leave' ? 'var(--text-accent)' : 'var(--white)'}}>{staff.currentAction}</div>
                                        <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                            <button className="icon-btn-edit" onClick={(e) => handleEditClick(staff, e)}>✎</button>
                                            <button className="icon-btn-delete" onClick={(e) => handleDeleteClick(staff.id, e)}>🗑️</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* PROFILE DETAILS */}
                    <div className="panel action-panel">
                        <div className="panel-header"><h2>Profile Details</h2></div>
                        {selectedStaff ? (
                            <div className="profile-detail-card card-dark">
                                <div className="profile-header-center">
                                    <div className="profile-initial-lg">{selectedStaff.initial}</div>
                                    <h2>{selectedStaff.name}</h2>
                                    <span className="role-main-accent">{selectedStaff.role}</span>
                                </div>
                                <div className="profile-details-list">
                                    <div className="detail-item"><span className="detail-label">Employee ID</span><strong className="detail-value text-gold">{selectedStaff.id}</strong></div>
                                    <div className="detail-item"><span className="detail-label">Current Status</span><span className={`badge badge-${getStatusClass(selectedStaff.status)}`}>{selectedStaff.status}</span></div>
                                    <div className="detail-item"><span className="detail-label">Phone Number</span><span className="detail-value">{selectedStaff.phone || '--'}</span></div>
                                    <div className="detail-item"><span className="detail-label">Email Address</span><span className="detail-value" style={{fontSize: '12px'}}>{selectedStaff.email}</span></div>
                                    <div className="detail-item"><span className="detail-label">Scheduled Shift</span><span className="detail-value" style={{textAlign: 'right'}}>{selectedStaff.shift}</span></div>
                                    <div className="detail-item"><span className="detail-label">Assigned Day Off</span><span className="detail-value" style={{color: '#ef5350'}}>{selectedStaff.dayOff}</span></div>
                                    <div className="detail-item" style={{borderBottom: 'none'}}><span className="detail-label">Hourly Rate</span><span className="detail-value text-gold">₱{selectedStaff.hourlyRate || 0}/hr</span></div>
                                </div>
                                <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                                    <button className="action-btn" style={{backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--white)'}} onClick={() => handleEditClick(selectedStaff)}>Edit Details</button>
                                </div>
                            </div>
                        ) : (
                            <div className="card-dark" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 20px', fontStyle: 'italic' }}>Select a staff member from the roster to view their full details.</div>
                        )}
                    </div>
                </div>
            </main>

            {/* MODAL */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="custom-modal" style={{ width: '500px', maxWidth: '95%' }}>
                        <h2 style={{fontSize: '24px', marginBottom: '20px', color: 'var(--text-accent)'}}>{editingStaff ? "Edit Employee" : "Add New Employee"}</h2>
                        <form onSubmit={handleSave} className="staff-form">
                            
                            {/* Row 1: Name and Role */}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                                <div className="form-group"><label>Full Name</label><input required type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Maria"/></div>
                                <div className="form-group"><label>Role</label><select name="role" value={formData.role} onChange={handleInputChange}><option>Cashier</option><option>Cook</option><option>Barista</option><option>Server</option><option>Manager</option></select></div>
                            </div>
                            
                            {/* Row 2: Email and Password */}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                                <div className="form-group"><label>Email (For Web Login)</label><input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="maria@clubc.com"/></div>
                                <div className="form-group"><label>Password</label><div style={{position: 'relative', display: 'flex', alignItems: 'center'}}><input required type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleInputChange} style={{width: '100%'}}/><button type="button" onClick={() => setShowPassword(!showPassword)} style={{position: 'absolute', right: '10px', background: 'none', border: 'none', color: 'var(--text-accent)', cursor: 'pointer', fontWeight: 'bold'}}>{showPassword ? "Hide" : "Show"}</button></div></div>
                            </div>

                            {/* Row 3: Phone, Hourly Rate, and PIN (FIXED LAYOUT) */}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px'}}>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+63 900 000 0000" style={{ width: '100%', boxSizing: 'border-box' }}/>
                                </div>
                                <div className="form-group">
                                    <label>Hourly Rate (₱)</label>
                                    <input required type="number" step="0.5" name="hourlyRate" value={formData.hourlyRate} onChange={handleInputChange} placeholder="e.g. 62.5" style={{ width: '100%', boxSizing: 'border-box' }}/>
                                </div>
                                <div className="form-group">
                                    <label style={{color: '#fbc02d'}}>4-Digit PIN</label>
                                    <input required type="text" maxLength="4" name="pin" value={formData.pin} onChange={handleInputChange} placeholder="1234" style={{ width: '100%', boxSizing: 'border-box', fontSize: '16px', letterSpacing: '5px', textAlign: 'center', borderColor: '#fbc02d' }}/>
                                </div>
                            </div>

                            {/* Row 4: Shift and Day Off */}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px'}}>
                                <div className="form-group"><label>Assigned Shift</label><input type="text" name="shift" value={formData.shift} onChange={handleInputChange} placeholder="e.g. Mon-Fri 8AM-5PM"/></div>
                                <div className="form-group"><label>Assigned Day Off</label><input type="text" name="dayOff" value={formData.dayOff} onChange={handleInputChange} placeholder="e.g. Monday"/></div>
                            </div>

                            <div className="modal-actions" style={{marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '15px'}}>
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save Employee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;