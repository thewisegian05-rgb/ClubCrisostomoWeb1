import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase.js'; 
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'; 
import './inventory.css';

const Inventory = () => {
    const navigate = useNavigate();
    
    // --- 1. CLOUD STATE & LIVE SYNC ---
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        const invCollection = collection(db, 'inventory');
        const unsubscribe = onSnapshot(invCollection, (snapshot) => {
            const invData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setInventory(invData);
        });
        return () => unsubscribe();
    }, []);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Supplies");
    const [activeTab, setActiveTab] = useState('Counter'); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    
    const [currentItem, setCurrentItem] = useState({ name: '', category: 'Coffee', quantity: '', baseline: '', backStock: '' });

    const handleNavigation = (path) => {
        navigate(path);
    };

    // --- BUTTON FUNCTIONALITIES ---
    const openAddModal = () => {
        setModalMode('add');
        setCurrentItem({ 
            name: '', 
            category: selectedCategory !== 'All Supplies' ? selectedCategory : 'Coffee', 
            quantity: '', 
            baseline: '',
            backStock: ''
        }); 
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setCurrentItem({ ...item }); 
        setIsModalOpen(true);
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem({ ...currentItem, [name]: value });
    };

    // --- 2. CLOUD CRUD OPERATIONS ---
    const handleSaveModal = async (e) => {
        e.preventDefault();
        
        if (!currentItem.name && activeTab === 'Counter') {
            alert("Please enter a product name.");
            return;
        }

        const qty = parseFloat(currentItem.quantity) || 0;
        const base = parseFloat(currentItem.baseline) || 1; 
        const backPackages = parseInt(currentItem.backStock) || 0;
        
        const percentage = Math.min(100, Math.max(0, (qty / base) * 100)); 

        let status = "Ample";
        let colorClass = "status-green";

        if (percentage <= 20) {
            status = "Critical";
            colorClass = "status-red";
        } else if (percentage <= 50) {
            status = "Low stock";
            colorClass = "status-yellow";
        }

        const itemData = {
            ...currentItem,
            quantity: qty,
            baseline: base,
            backStock: backPackages,
            stockPercentage: percentage, 
            status: status,
            colorClass: colorClass
        };

        try {
            if (modalMode === 'add') {
                const newId = `INV${Date.now()}`;
                await setDoc(doc(db, 'inventory', newId), itemData);
            } else {
                await updateDoc(doc(db, 'inventory', currentItem.id), itemData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving inventory item:", error);
            alert("Failed to save. Check console for details.");
        }
    };

    const handleDeleteItem = async (id) => {
        if (window.confirm("Are you sure you want to remove this item?")) {
            await deleteDoc(doc(db, 'inventory', id));
            setIsModalOpen(false); 
        }
    };

    const handleRestock = async (id) => {
        const itemToRestock = inventory.find(item => item.id === id);
        if (!itemToRestock) return;

        if (itemToRestock.backStock > 0) {
            const currentQty = parseFloat(itemToRestock.quantity) || 0;
            const baselineQty = parseFloat(itemToRestock.baseline) || 1;
            
            const newQty = currentQty + baselineQty;
            const newBackStock = itemToRestock.backStock - 1; 
            
            const percentage = Math.min(100, Math.max(0, (newQty / baselineQty) * 100));

            await updateDoc(doc(db, 'inventory', id), {
                quantity: newQty,
                backStock: newBackStock,
                stockPercentage: percentage,
                status: "Ample",
                colorClass: "status-green"
            });
        } else {
            alert("Cannot restock! You have 0 packages left in the back inventory.");
        }
    };

    // --- FILTER LOGIC ---
    const filteredInventory = inventory.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All Supplies" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="dashboard-container">
            {/* --- ADMIN SIDEBAR (Perfect Match) --- */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ color: '#c8a27c', margin: '20px 0', fontSize: '24px', letterSpacing: '1px' }}>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => handleNavigation('/admin')}>
                            <span className="icon">🏠</span> DashBoard
                        </li>
                        <li className="active" onClick={() => handleNavigation('/admin/inventory')}>
                            <span className="icon">📦</span> Inventory
                        </li>
                        <li onClick={() => handleNavigation('/admin/menu')}>
                            <span className="icon">☕</span> Menu
                        </li>
                        <li onClick={() => handleNavigation('/admin/staffs-management')}>
                            <span className="icon">👥</span> Staff
                        </li>
                        <li onClick={() => handleNavigation('/admin/reports')}>
                            <span className="icon">📊</span> Reports
                        </li>
                        <li onClick={() => handleNavigation('/admin/settingsadmin')}>
                            <span className="icon">⚙️</span> Settings
                        </li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="inventory-header">
                    <div className="header-titles">
                        <h1>Inventory Overview</h1>
                        <p>Check the stock level of raw materials that need restocking below.</p>
                    </div>
                    <div className="header-actions">
                        <div className="search-bar">
                            <span className="search-icon"></span>
                            <input 
                                type="text" 
                                placeholder="Search raw material..." 
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="add-btn" onClick={openAddModal}>+ Add items</button>
                    </div>
                </header>

                <div className="inventory-tabs">
                    <span 
                        className={`tab ${activeTab === 'Counter' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('Counter')}
                    >
                        On Counter
                    </span>
                    <span 
                        className={`tab ${activeTab === 'Backroom' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('Backroom')}
                    >
                        On Inventory (Back Stock)
                    </span>
                </div>

                <div className="smart-insight-banner">
                    <span className="insight-icon">💡</span>
                    <div className="insight-text">
                        <strong>Staff Guide:</strong> Use the <span style={{color: 'var(--text-accent)'}}>ACTION TOOLS</span> exclusively for modifying <span style={{color: 'var(--text-accent)'}}>INVENTORY ERRORS</span>.
                    </div>
                </div>

                <div className="inventory-controls">
                    <div className="filters">
                        <select 
                            className="category-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="All Supplies">All Supplies</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Dairy">Dairy</option>
                            <option value="Syrups">Syrups</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="status-legend">
                        <span><div className="dot green-dot"></div> Ample</span>
                        <span><div className="dot yellow-dot"></div> Low stock</span>
                        <span><div className="dot red-dot"></div> Critical</span>
                    </div>
                </div>

                <div className="inventory-list-container">
                    <div className="inventory-list-header">
                        <div className="col-name">Raw Material</div>
                        <div className="col-stock">Stock Level</div>
                        <div className="col-cost" style={{textAlign: 'center'}}>{activeTab === 'Counter' ? 'Quantity' : 'Packages in Stock'}</div>
                        <div className="col-status">Status</div>
                        <div className="col-actions">Actions</div>
                    </div>

                    <div className="inventory-list-body">
                        {filteredInventory.map((item) => {
                            const isBackroom = activeTab === 'Backroom';
                            const backQty = parseInt(item.backStock) || 0;
                            
                            let displayStatus = item.status;
                            let displayColor = item.colorClass;
                            let displayPercentage = item.stockPercentage;

                            if (isBackroom) {
                                if (backQty <= 1) {
                                    displayStatus = "Critical";
                                    displayColor = "status-red";
                                    displayPercentage = backQty === 1 ? 33 : 0;
                                } else if (backQty === 2) {
                                    displayStatus = "Low stock";
                                    displayColor = "status-yellow";
                                    displayPercentage = 66;
                                } else {
                                    displayStatus = "Ample";
                                    displayColor = "status-green";
                                    displayPercentage = 100;
                                }
                            }

                            return (
                                <div className="inventory-row" key={item.id}>
                                    <div className="col-name">
                                        <strong>{item.name}</strong>
                                        <span>{item.category}</span>
                                    </div>
                                    
                                    <div className="col-stock">
                                        <div className="progress-bar-bg">
                                            <div className={`progress-fill ${displayColor}`} style={{ width: `${displayPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
                                        </div>
                                    </div>

                                    <div className="col-cost" style={{ textAlign: 'center', fontSize: isBackroom ? '1.2rem' : '1rem', fontWeight: isBackroom ? 'bold' : 'normal' }}>
                                        {isBackroom ? (
                                            <>{item.backStock} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal'}}> Pkgs</span></>
                                        ) : (
                                            <>{item.quantity} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal'}}>/ {item.baseline}</span></>
                                        )}
                                    </div>
                                    
                                    <div className="col-status">
                                        <span className={`badge ${displayColor}`}>{displayStatus}</span>
                                    </div>
                                    
                                    <div className="col-actions">
                                        {!isBackroom && (
                                            <button className="action-btn restock" onClick={() => handleRestock(item.id)}>Restock</button>
                                        )}
                                        <button className="action-btn edit" onClick={() => openEditModal(item)}>Edit</button>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {filteredInventory.length === 0 && (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "1.1rem" }}>
                                {inventory.length === 0 
                                    ? "Your inventory is currently empty. Click '+ Add items' to get started!" 
                                    : "No items found matching your filter."}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* --- UNIFIED MODAL OVERLAY --- */}
            {isModalOpen && currentItem && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h2>{modalMode === 'add' ? 'Add New Raw Material' : 'Edit Raw Material'}</h2>
                        
                        <form onSubmit={handleSaveModal}>
                            {modalMode === 'edit' && activeTab === 'Backroom' ? (
                                <>
                                    <h3 style={{ color: 'var(--text-main)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                        {currentItem.name}
                                    </h3>
                                    
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={currentItem.category} onChange={handleModalInputChange}>
                                            <option value="Coffee">Coffee</option>
                                            <option value="Dairy">Dairy</option>
                                            <option value="Syrups">Syrups</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Baseline Quantity (Per package)</label>
                                        <input type="number" name="baseline" value={currentItem.baseline} onChange={handleModalInputChange} placeholder="e.g. 100"/>
                                    </div>

                                    <div className="form-group">
                                        <label>Package Quantity (Back Stock)</label>
                                        <input type="number" name="backStock" value={currentItem.backStock} onChange={handleModalInputChange} placeholder="e.g. 5"/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Product name</label>
                                        <input type="text" name="name" value={currentItem.name} onChange={handleModalInputChange} placeholder="e.g. Plastic Cups" required/>
                                    </div>

                                    <div className="form-group">
                                        <label>Category</label>
                                        <select name="category" value={currentItem.category} onChange={handleModalInputChange}>
                                            <option value="Coffee">Coffee</option>
                                            <option value="Dairy">Dairy</option>
                                            <option value="Syrups">Syrups</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    {modalMode === 'add' && (
                                        <div className="form-group">
                                            <label>Baseline Quantity (Per package)</label>
                                            <input type="number" name="baseline" value={currentItem.baseline} onChange={handleModalInputChange} placeholder="e.g. 100" required/>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Current Stock (Quantity on hand)</label>
                                        <input type="number" name="quantity" value={currentItem.quantity} onChange={handleModalInputChange} placeholder="e.g. 50" required/>
                                    </div>

                                    {modalMode === 'add' && (
                                        <div className="form-group">
                                            <label>Initial Packages at Back</label>
                                            <input type="number" name="backStock" value={currentItem.backStock} onChange={handleModalInputChange} placeholder="e.g. 5" required/>
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '30px 0 0 0' }}>
                                {modalMode === 'edit' ? (
                                    <button 
                                        type="button"
                                        className="cancel-btn" 
                                        style={{ color: '#ef5350', borderColor: 'rgba(239, 83, 80, 0.3)' }} 
                                        onClick={() => handleDeleteItem(currentItem.id)}
                                    >
                                        Remove item
                                    </button>
                                ) : <div></div>}
                                
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="save-btn">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;