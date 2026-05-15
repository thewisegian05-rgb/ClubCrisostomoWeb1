import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar.jsx'; // Adjust path if needed

const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState([]);

  useEffect(() => {
    // 1. Fetch the exact same data the Attendance page uses
    const savedStaff = localStorage.getItem('clubC_staffData');
    if (savedStaff) {
      setPayrollData(JSON.parse(savedStaff));
    }
  }, []);

  // --- TIME MATH HELPER FUNCTIONS ---
  // Converts "8:30 PM" into a standard decimal number (20.5) so we can do math on it
  const parseTime = (timeStr) => {
    if (!timeStr || timeStr === '--') return null;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (modifier === 'PM' && hours < 12) hours += 12;
    
    return hours + (minutes / 60);
  };

  // Subtracts Start Time from End Time to get Total Hours
  const calculateHours = (startStr, endStr) => {
    const start = parseTime(startStr);
    const end = parseTime(endStr);
    
    if (start === null || end === null) return 0;
    
    let diff = end - start;
    if (diff < 0) diff += 24; // Handles night shifts crossing midnight
    return diff;
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h1>Admin Payroll Management</h1>
          <div className="header-actions">
            <button className="action-btn action-btn-active-gold" style={{width: 'auto', padding: '10px 20px'}}>
              Export to PDF
            </button>
          </div>
        </header>

        <section className="panel card-dark" style={{ padding: '0' }}>
          <div className="panel-header" style={{ padding: '20px 20px 0 20px' }}>
            <h2>Today's Estimated Payroll</h2>
            <p style={{color: 'var(--text-darker)', fontSize: '0.9rem', marginTop: '5px'}}>
              Calculations are based on today's active shift timestamps.
            </p>
          </div>
          
          <div className="logs-table" style={{ marginTop: '20px' }}>
            {/* TABLE HEADER */}
            <div className="logs-header-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '15px 20px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <span>Staff Name</span>
              <span>Rate / Hr</span>
              <span>Gross Hours</span>
              <span>Break Time</span>
              <span>Net Hours</span>
              <span style={{textAlign: 'right'}}>Total Pay</span>
            </div>

            {/* TABLE BODY */}
            {payrollData.length === 0 ? (
              <div className="empty-logs">No staff data available.</div>
            ) : (
              payrollData.map((staff) => {
                const t = staff.timestamps || {};
                
                // Set a default rate of ₱75 if one hasn't been added to the database yet
                const hourlyRate = staff.hourlyRate || 75; 

                // Run the math!
                const grossHours = calculateHours(t.clockIn, t.clockOut);
                const breakHours = calculateHours(t.breakStart, t.breakEnd);
                const netHours = Math.max(0, grossHours - breakHours); // Ensure it doesn't go below 0
                const totalPay = netHours * hourlyRate;

                // Status checking
                const isShiftIncomplete = t.clockIn && !t.clockOut;

                return (
                  <div key={staff.id} className="logs-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr', padding: '15px 20px' }}>
                    
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                      <strong>{staff.name}</strong>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-darker)'}}>{staff.role}</span>
                    </div>
                    
                    <span style={{color: 'var(--text-muted)'}}>₱{hourlyRate.toFixed(2)}</span>
                    
                    {isShiftIncomplete ? (
                      <span style={{color: '#fbc02d', fontStyle: 'italic', gridColumn: 'span 4'}}>
                        Shift currently in progress... (Clocked in at {t.clockIn})
                      </span>
                    ) : (
                      <>
                        <span>{grossHours > 0 ? grossHours.toFixed(2) + ' hrs' : '--'}</span>
                        <span>{breakHours > 0 ? breakHours.toFixed(2) + ' hrs' : '--'}</span>
                        <strong style={{color: 'var(--text-light)'}}>
                          {netHours > 0 ? netHours.toFixed(2) + ' hrs' : '--'}
                        </strong>
                        <strong style={{color: '#81c784', textAlign: 'right', fontSize: '1.1rem'}}>
                          {totalPay > 0 ? `₱${totalPay.toFixed(2)}` : '--'}
                        </strong>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PayrollPage;