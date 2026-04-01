import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './staff.css';

// Initial Mock Data 
const INITIAL_STAFF = [
    { 
        id: 1, 
        name: "Ba2te", 
        role: "Barista", 
        status: "Active", 
        shift: "Mon-Fri\n8AM - 5PM",
        phone: "+63 919 698 1324",
        email: "Ba2te@email.com",
        password: "password123", 
        dayOff: "Monday"
    },
    { 
        id: 2, 
        name: "Juan", 
        role: "Server", 
        status: "Inactive", 
        shift: "Flexible",
        phone: "+63 912 345 6789",
        email: "Juan.server@email.com",
        password: "password123",
        dayOff: "Tuesday"
    },
    { 
        id: 3, 
        name: "Kulas", 
        role: "Cashier", 
        status: "Active", 
        shift: "Mon-Wed\n8AM - 5PM",
        phone: "+63 999 888 7777",
        email: "kulas.c@email.com",
        password: "password123",
        dayOff: "Thursday"
    }
];

const Staff = () => {
    const navigate = useNavigate();
    
    // --- Core State with LocalStorage ---
    const [staffList, setStaffList] = useState(() => {
        const savedStaff = localStorage.getItem('clubCStaffData');
        if (savedStaff) {
            return JSON.parse(savedStaff);
        }
        return INITIAL_STAFF;
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStaff, setSelectedStaff] = useState(staffList.length > 0 ? staffList[0] : null); 
    
    // Save to LocalStorage whenever staffList changes
    useEffect(() => {
        localStorage.setItem('clubCStaffData', JSON.stringify(staffList));
    }, [staffList]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [showPassword, setShowPassword] = useState(false); 
    
    // Filter State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All'); 

    const [formData, setFormData] = useState({
        name: '', role: 'Cashier', status: 'Active', shift: '', phone: '', email: '', password: '', dayOff: ''
    });

    // --- NAVIGATION ---
    const handleNavigation = (path) => {
        navigate(path);
    };

    // --- CRUD OPERATIONS ---
    const handleAddClick = () => {
        setEditingStaff(null);
        setFormData({ name: '', role: 'Cashier', status: 'Active', shift: '', phone: '', email: '', password: '', dayOff: '' });
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

    const handleDeleteClick = (id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this staff member?")) {
            const updatedList = staffList.filter(staff => staff.id !== id);
            setStaffList(updatedList);
            if (selectedStaff?.id === id) {
                setSelectedStaff(updatedList.length > 0 ? updatedList[0] : null);
            }
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (editingStaff) {
            const updatedList = staffList.map(s => s.id === editingStaff.id ? { ...formData, id: s.id } : s);
            setStaffList(updatedList);
            if (selectedStaff?.id === editingStaff.id) setSelectedStaff({ ...formData, id: editingStaff.id });
        } else {
            const newStaff = { ...formData, id: Date.now() }; 
            setStaffList([...staffList, newStaff]);
        }
        setIsModalOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- FILTER & CALCULATIONS ---
    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              staff.role.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || staff.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const activeCount = staffList.filter(s => s.status === 'Active').length;
    const onBreakCount = staffList.filter(s => s.status === 'On Break').length; // Added On Break Count
    const inactiveCount = staffList.filter(s => s.status === 'Inactive').length;
    const onLeaveCount = staffList.filter(s => s.status === 'On Leave').length;

    const getStatusClass = (status) => {
        return status.toLowerCase().replace(' ', '-');
    };

    return (
        <div className="dashboard-container">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => handleNavigation('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li onClick={() => handleNavigation('/admin/inventory')}><span className="icon">📦</span> Inventory</li>
                        <li onClick={() => handleNavigation('/admin/menu')}><span className="icon">☕</span> Menu</li>
                        <li className="active"><span className="icon">👥</span> Staff</li>
                        <li onClick={() => handleNavigation('/admin/reports')}><span className="icon">📊</span> Reports</li>
                        <li onClick={() => handleNavigation('/admin/settingsadmin')}><span className="icon">⚙️</span> Settings</li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                
                {/* HEADER */}
                <header className="staff-header">
                    <div className="header-titles">
                        <h1>Staff Management</h1>
                    </div>
                    
                    <div className="staff-header-actions">
                        <input 
                            type="text" 
                            placeholder="Search staff/roles..." 
                            className="staff-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="staff-add-btn" onClick={handleAddClick}>+ Add staff</button>
                    </div>
                </header>

                {/* METRICS ROW (Now has 5 columns) */}
                <div className="staff-metrics-grid">
                    <div className="staff-metric-card">
                        <div className="metric-header">
                            <span className="dot grey-dot"></span> Total Staff
                        </div>
                        <div className="metric-value">{staffList.length}</div>
                    </div>
                    <div className="staff-metric-card">
                        <div className="metric-header">
                            <span className="dot green-dot"></span> Active
                        </div>
                        <div className="metric-value text-green">{activeCount}</div>
                    </div>
                    <div className="staff-metric-card">
                        <div className="metric-header">
                            <span className="dot yellow-dot"></span> On Break
                        </div>
                        <div className="metric-value text-yellow">{onBreakCount}</div>
                    </div>
                    <div className="staff-metric-card">
                        <div className="metric-header">
                            <span className="dot red-dot"></span> Inactive
                        </div>
                        <div className="metric-value text-red">{inactiveCount}</div>
                    </div>
                    <div className="staff-metric-card">
                        <div className="metric-header">
                            <span className="dot grey-dot"></span> On Leave
                        </div>
                        <div className="metric-value">{onLeaveCount}</div> 
                    </div>
                </div>

                {/* TWO-COLUMN LAYOUT */}
                <div className="staff-content-grid">
                    
                    {/* LEFT: STAFF LIST */}
                    <div className="widget staff-list-widget">
                        <div className="widget-header-row">
                            <h2>Staff List</h2>
                            
                            <div className="filter-container">
                                <div className="filter-dropdown" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                                    <span>{statusFilter === 'All' ? 'Filter' : statusFilter}</span>
                                    <span>⌵</span>
                                </div>
                                
                                {isFilterOpen && (
                                    <div className="filter-menu">
                                        <div 
                                            className={statusFilter === 'All' ? 'active-filter' : ''} 
                                            onClick={() => { setStatusFilter('All'); setIsFilterOpen(false); }}
                                        >All</div>
                                        <div 
                                            className={statusFilter === 'Active' ? 'active-filter' : ''} 
                                            onClick={() => { setStatusFilter('Active'); setIsFilterOpen(false); }}
                                        >Active</div>
                                        <div 
                                            className={statusFilter === 'On Break' ? 'active-filter' : ''} 
                                            onClick={() => { setStatusFilter('On Break'); setIsFilterOpen(false); }}
                                        >On Break</div>
                                        <div 
                                            className={statusFilter === 'Inactive' ? 'active-filter' : ''} 
                                            onClick={() => { setStatusFilter('Inactive'); setIsFilterOpen(false); }}
                                        >Inactive</div>
                                        <div 
                                            className={statusFilter === 'On Leave' ? 'active-filter' : ''} 
                                            onClick={() => { setStatusFilter('On Leave'); setIsFilterOpen(false); }}
                                        >On Leave</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="staff-table">
                            <div className="staff-table-header">
                                <div className="col-name">Name | Role</div>
                                <div className="col-status">Status</div>
                                <div className="col-shift">Shift</div>
                                <div className="col-actions">Action</div>
                            </div>
                            
                            <div className="staff-table-body">
                                {filteredStaff.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No staff found.</div>
                                ) : (
                                    filteredStaff.map((staff) => (
                                        <div 
                                            key={staff.id} 
                                            className={`staff-table-row ${selectedStaff?.id === staff.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedStaff(staff)}
                                        >
                                            <div className="col-name staff-profile-cell">
                                                <div className="pic-placeholder-small">{staff.name.charAt(0)}</div>
                                                <div className="name-role">
                                                    <strong>{staff.name}</strong>
                                                    <span>{staff.role}</span>
                                                </div>
                                            </div>
                                            <div className="col-status">
                                                <span className={`status-badge ${getStatusClass(staff.status)}`}>
                                                    {staff.status}
                                                </span>
                                            </div>
                                            <div className="col-shift">
                                                {staff.shift.split('\n').map((line, index) => (
                                                    <div key={index}>{line}</div>
                                                ))}
                                            </div>
                                            <div className="col-actions">
                                                <button className="edit-btn" onClick={(e) => handleEditClick(staff, e)}>Edit</button>
                                                <button className="delete-btn" onClick={(e) => handleDeleteClick(staff.id, e)}>Delete</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: STAFF PROFILE DETAILS */}
                    <div className="widget staff-profile-widget">
                        {selectedStaff ? (
                            <>
                                <div className="large-pic-placeholder">{selectedStaff.name.charAt(0)}</div>
                                
                                <div className="profile-details">
                                    <h2>{selectedStaff.name}</h2>
                                    <p className="contact-info">{selectedStaff.phone}</p>
                                    <p className="contact-info">{selectedStaff.email}</p>
                                    
                                    <div className="profile-section">
                                        <span className="label">Day off</span>
                                        <span className="value">{selectedStaff.dayOff}</span>
                                    </div>

                                    <div className="profile-action-btns">
                                        <button className="profile-edit-btn" onClick={() => handleEditClick(selectedStaff)}>Edit Profile</button>
                                        <button className="profile-delete-btn" onClick={() => handleDeleteClick(selectedStaff.id)}>Delete Staff</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#888', marginTop: '50px' }}>
                                Select a staff member to view details.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ADD/EDIT MODAL OVERLAY */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingStaff ? "Edit Staff" : "Add New Staff"}</h2>
                        <form onSubmit={handleSave} className="staff-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} />
                            </div>
                            
                            <div className="form-group">
                                <label>Role</label>
                                <select name="role" value={formData.role} onChange={handleInputChange}>
                                    <option value="Cashier">Cashier</option>
                                    <option value="Cook">Cook</option>
                                    <option value="Barista">Barista</option>
                                    <option value="Server">Server</option>
                                    <option value="Part-Time Cashier">Part-Time Cashier</option>
                                    <option value="Part-Time Cook">Part-Time Cook</option>
                                    <option value="Part-Time Barista">Part-Time Barista</option>
                                    <option value="Part-Time Server">Part-Time Server</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange}>
                                    <option value="Active">Active</option>
                                    <option value="On Break">On Break</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label>Account Password</label>
                                <div className="password-input-wrapper">
                                    <input 
                                        required 
                                        type={showPassword ? "text" : "password"} 
                                        name="password" 
                                        value={formData.password} 
                                        onChange={handleInputChange} 
                                        placeholder="Enter a secure password"
                                    />
                                    <button 
                                        type="button" 
                                        className="password-toggle-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Day Off</label>
                                <input type="text" name="dayOff" value={formData.dayOff} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Shift (Use \n for new line)</label>
                                <input type="text" name="shift" value={formData.shift} onChange={handleInputChange} />
                            </div>
                            
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Staff;