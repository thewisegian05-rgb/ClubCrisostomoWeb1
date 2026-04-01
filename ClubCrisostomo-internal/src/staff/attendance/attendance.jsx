import React, { useState } from 'react';
import Sidebar from '../components/sidebar.jsx';
import './attendance.css';

// --- MOCK DATABASE WITH PINS ---
const initialStaffData = [
  { id: 'STF001', name: 'Kulas', role: 'Cashier', status: 'On Leave', shift: 'Mon-Wed 8AM - 5PM', initial: 'K', pin: '1111', currentAction: 'Off Shift' },
  { id: 'STF002', name: 'Gian Carlo Almonte', role: 'Barista', status: 'Active', shift: 'Flexible', initial: 'G', pin: '2222', currentAction: 'Clocked In' },
  { id: 'STF003', name: 'Gian Carlo Almonte', role: 'Part-time Cook', status: 'Inactive', shift: 'Mon-Fri 8AM - 5PM', initial: 'G', pin: '3333', currentAction: 'Off Shift' },
  { id: 'STF004', name: 'Jhillian', role: 'Cashier', status: 'Active', shift: 'Sat - Sun 8AM - 5PM', initial: 'J', pin: '4321', currentAction: 'Clocked In' },
];

function AttendancePage() {
  const [staffList, setStaffList] = useState(initialStaffData);
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffData[0].id);
  
  const [unlockedStaffId, setUnlockedStaffId] = useState(null); 
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedStaff = staffList.find(s => s.id === selectedStaffId);
  const isUnlocked = unlockedStaffId === selectedStaff.id;

  const handleSelectStaff = (id) => {
    setSelectedStaffId(id);
    setPinInput('');
    setErrorMessage('');
    setSuccessMessage('');
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

  const handleShiftAction = (actionType) => {
    let newAction = '';
    let newStatus = '';
    let message = '';

    switch (actionType) {
      case 'clock_in':
        newAction = 'Clocked In';
        newStatus = 'Active';
        message = `Successfully clocked in at ${new Date().toLocaleTimeString()}.`;
        break;
      case 'clock_out':
        newAction = 'Off Shift';
        newStatus = 'Inactive';
        message = `Successfully clocked out at ${new Date().toLocaleTimeString()}.`;
        setUnlockedStaffId(null); 
        break;
      case 'go_active':
        newAction = 'Clocked In';
        newStatus = 'Active';
        message = "Status updated to Active.";
        break;
      case 'go_break':
        newAction = 'On Break';
        newStatus = 'On Break'; // <-- UPDATED THIS LINE
        message = "Status updated to On Break.";
        break;
      default:
        return;
    }

    const updatedStaffList = staffList.map(staff => {
      if (staff.id === selectedStaff.id) {
        return { ...staff, currentAction: newAction, status: newStatus };
      }
      return staff;
    });

    setStaffList(updatedStaffList);
    setSuccessMessage(message);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge badge-active';
      case 'Inactive': return 'badge badge-inactive';
      case 'On Leave': return 'badge badge-leave';
      case 'On Break': return 'badge badge-break'; // <-- ADDED THIS LINE
      default: return 'badge';
    }
  };

  const renderActionButtons = () => {
    if (selectedStaff.currentAction === 'Off Shift') {
      return (
        <button className="action-btn action-btn-green" onClick={() => handleShiftAction('clock_in')}>
          ⏱️ Clock In Now
        </button>
      );
    } else if (selectedStaff.currentAction === 'Clocked In') {
      return (
        <div className="action-button-group">
          <button className="action-btn action-btn-orange" onClick={() => handleShiftAction('go_break')}>
            ☕ Go On Break
          </button>
          <button className="action-btn action-btn-red" onClick={() => handleShiftAction('clock_out')}>
            🚪 Clock Out
          </button>
        </div>
      );
    } else if (selectedStaff.currentAction === 'On Break') {
      return (
        <div className="action-button-group">
          <button className="action-btn action-btn-active-gold" onClick={() => handleShiftAction('go_active')}>
            ▶️ Resume Shift
          </button>
          <button className="action-btn action-btn-red" onClick={() => handleShiftAction('clock_out')}>
            🚪 Clock Out
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="attendance-page dark-theme">
      <Sidebar />
      <div className="main-content">
        <header className="page-header">
          <h1>Attendance & Shift Management</h1>
          <div className="header-actions">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search staff / roles" />
            </div>
          </div>
        </header>

        <section className="attendance-panels-row">
          
          {/* LEFT: STAFF LIST PANEL */}
          <div className="panel list-panel">
            <div className="panel-header">
              <h2>Staff On Floor</h2>
              <button className="filter-btn">Filter <span className="arrow-down">▼</span></button>
            </div>
            
            <div className="staff-list">
              <div className="list-header-row">
                <span>Name | Role</span>
                <span>Status</span>
                <span>Shift</span>
              </div>
              {staffList.map((staff) => (
                <div 
                  key={staff.id} 
                  className={`staff-list-item ${selectedStaff.id === staff.id ? 'selected' : ''}`}
                  onClick={() => handleSelectStaff(staff.id)}
                >
                  <div className="staff-info-col">
                    <div className="staff-initial">{staff.initial}</div>
                    <div className="staff-name-role">
                      <strong>{staff.name}</strong>
                      <span className="staff-role-sub">{staff.role}</span>
                    </div>
                  </div>
                  <div className="staff-status-col">
                    <span className={getStatusBadgeClass(staff.status)}>{staff.status}</span>
                  </div>
                  <div className="staff-shift-col">
                    {staff.shift}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: ACTION & DETAIL PANEL */}
          <div className="panel action-panel">
            <div className="panel-header">
              <h2>Action Panel</h2>
            </div>
            
            {/* Security Verification & Shift Status Section */}
            <div className="security-section card-dark">
              {!isUnlocked ? (
                <form onSubmit={handleUnlockProfile} className="secure-shift-management" style={{textAlign: 'center'}}>
                  <span style={{ fontSize: '30px', display: 'block', marginBottom: '10px' }}>🔒</span>
                  <h3 className="section-title-accent" style={{marginBottom: '5px'}}>Authorization Required</h3>
                  <p style={{ color: 'var(--text-darker)', marginBottom: '20px', fontSize: '0.9rem' }}>
                    Enter PIN for <strong>{selectedStaff.name}</strong> to manage shift.
                  </p>
                  
                  <input 
                    type="password" 
                    maxLength="4"
                    placeholder="••••"
                    className="secure-pin-input"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    autoFocus
                  />
                  
                  {errorMessage && <div className="error-msg">{errorMessage}</div>}
                  
                  <button type="submit" className="action-btn action-btn-active-gold" style={{marginTop: '10px'}}>
                    Unlock Actions
                  </button>
                </form>
              ) : (
                <div className="secure-shift-management">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <h3 className="section-title-accent" style={{margin: 0}}>Manage Shift</h3>
                    <button 
                      onClick={() => setUnlockedStaffId(null)} 
                      style={{background: 'transparent', border: 'none', color: 'var(--text-darker)', cursor: 'pointer', textDecoration: 'underline'}}
                    >
                      Lock Profile
                    </button>
                  </div>
                  
                  <p className="section-subtitle">
                    Current Action: <strong style={{color: '#fff'}}>{selectedStaff.currentAction}</strong>
                  </p>
                  
                  {successMessage && <div className="success-msg">{successMessage}</div>}

                  <div className="verified-actions-container">
                    {renderActionButtons()}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Staff Details Section */}
            <div className="profile-detail-card card-dark">
              <div className="profile-header-center">
                <div className="profile-initial-lg">{selectedStaff.initial}</div>
                <h2>{selectedStaff.name}</h2>
                <span className="role-main-accent">{selectedStaff.role}</span>
              </div>
              
              <div className="profile-details-list">
                <div className="detail-item">
                  <span className="detail-label">Staff ID</span>
                  <strong className="detail-value text-gold">{selectedStaff.id}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Status</span>
                  <span className={getStatusBadgeClass(selectedStaff.status)}>{selectedStaff.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Scheduled Shift</span>
                  <span className="detail-value">{selectedStaff.shift}</span>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}

export default AttendancePage;