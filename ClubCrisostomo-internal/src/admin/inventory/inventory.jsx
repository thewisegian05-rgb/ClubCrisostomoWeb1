import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './inventory.css';

const INITIAL_INVENTORY = [];

const Inventory = () => {
    const navigate = useNavigate();
    
    // 1. SMART STATE: Check Local Storage first, if empty, use INITIAL_INVENTORY
    const [inventory, setInventory] = useState(() => {
        const savedInventory = localStorage.getItem("clubC_inventory");
        if (savedInventory) {
            return JSON.parse(savedInventory);
        } else {
            return INITIAL_INVENTORY;
        }
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Supplies");
    const [activeTab, setActiveTab] = useState('Counter'); // 'Counter' or 'Backroom'

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); 
    
    const [currentItem, setCurrentItem] = useState({ name: '', category: 'Coffee', quantity: '', baseline: '', backStock: '' });

    useEffect(() => {
        localStorage.setItem("clubC_inventory", JSON.stringify(inventory));
    }, [inventory]);

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

    const handleSaveModal = () => {
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

        if (modalMode === 'add') {
            const newItem = {
                ...currentItem,
                backStock: backPackages,
                id: Date.now(), 
                stockPercentage: percentage, 
                status: status,
                colorClass: colorClass
            };
            setInventory([...inventory, newItem]);
        } else {
            setInventory(inventory.map(item => 
                item.id === currentItem.id ? { 
                    ...currentItem, 
                    backStock: backPackages,
                    stockPercentage: percentage, 
                    status: status, 
                    colorClass: colorClass
                } : item
            ));
        }
        
        setIsModalOpen(false);
    };

    const handleDeleteItem = (id) => {
        if (window.confirm("Are you sure you want to remove this item?")) {
            setInventory(inventory.filter(item => item.id !== id));
            setIsModalOpen(false); 
        }
    };

    const handleRestock = (id) => {
        let outOfStockError = false;

        const updatedInventory = inventory.map(item => {
            if (item.id === id) {
                if (item.backStock > 0) {
                    const currentQty = parseFloat(item.quantity) || 0;
                    const baselineQty = parseFloat(item.baseline) || 1;
                    
                    const newQty = currentQty + baselineQty;
                    const newBackStock = item.backStock - 1; 
                    
                    const percentage = Math.min(100, Math.max(0, (newQty / baselineQty) * 100));

                    return { 
                        ...item, 
                        quantity: newQty, 
                        backStock: newBackStock,
                        stockPercentage: percentage, 
                        status: "Ample", 
                        colorClass: "status-green"
                    };
                } else {
                    outOfStockError = true;
                    return item;
                }
            }
            return item;
        });

        if (outOfStockError) {
            alert("Cannot restock! You have 0 packages left in the back inventory.");
        } else {
            setInventory(updatedInventory);
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
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => handleNavigation('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li className="active"><span className="icon">📦</span> Inventory</li>
                        <li onClick={() => handleNavigation('/admin/menu')}><span className="icon">☕</span> Menu</li>
                        <li onClick={() => handleNavigation('/admin/staffs-management')}><span className="icon">👥</span> Staff</li>
                        <li onClick={() => handleNavigation('/admin/reports')}><span className="icon">📊</span> Reports</li>
                        <li onClick={() => handleNavigation('/admin/settingsadmin')}><span className="icon">⚙️</span> Settings</li>
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
                        <input 
                            type="text" 
                            placeholder="Search raw material..." 
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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

                <div className="tutorial-banner">
                    <span className="insight-icon">💡</span>
                    <div className="insight-text">
                        <strong>Staff Guide:</strong> Use the <span className="highlight-restock">ACTION TOOLS</span>  exclusively for modifying <span className="highlight-restock">INVENTORY ERRORS</span>.
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
                        <input 
                            type="text" 
                            placeholder="Filter list..." 
                            className="filter-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                        <div className="col-cost">{activeTab === 'Counter' ? 'Quantity' : 'Packages in Stock'}</div>
                        <div className="col-status">Status</div>
                        <div className="col-actions">Actions</div>
                    </div>

                    <div className="inventory-list-body">
                        {filteredInventory.map((item) => {
                            const isBackroom = activeTab === 'Backroom';
                            const backQty = parseInt(item.backStock) || 0;
                            
                            // Dynamically calculate status/color based on the active tab
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

                                    <div className="col-cost" style={{ fontSize: isBackroom ? '1.2rem' : '1rem', fontWeight: isBackroom ? 'bold' : 'normal' }}>
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
                                        {/* Only show Restock on the Counter Tab */}
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
                        
                        {/* --- EDIT MODE IN BACKROOM TAB --- */}
                        {modalMode === 'edit' && activeTab === 'Backroom' ? (
                            <>
                                <h3 style={{ color: 'var(--white)', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                                    {currentItem.name}
                                </h3>
                                
                                <div className="form-group">
                                    <label>Category</label>
                                    <select 
                                        name="category" 
                                        value={currentItem.category} 
                                        onChange={handleModalInputChange}
                                    >
                                        <option value="Coffee">Coffee</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Syrups">Syrups</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Baseline Quantity (Per package)</label>
                                    <input 
                                        type="number" 
                                        name="baseline" 
                                        value={currentItem.baseline} 
                                        onChange={handleModalInputChange} 
                                        placeholder="e.g. 100"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Package Quantity (Back Stock)</label>
                                    <input 
                                        type="number" 
                                        name="backStock" 
                                        value={currentItem.backStock} 
                                        onChange={handleModalInputChange} 
                                        placeholder="e.g. 5"
                                    />
                                </div>
                            </>
                        ) : (
                            /* --- ADD NEW ITEM OR EDIT ON COUNTER TAB --- */
                            <>
                                <div className="form-group">
                                    <label>Product name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={currentItem.name} 
                                        onChange={handleModalInputChange} 
                                        placeholder="e.g. Plastic Cups"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Category</label>
                                    <select 
                                        name="category" 
                                        value={currentItem.category} 
                                        onChange={handleModalInputChange}
                                    >
                                        <option value="Coffee">Coffee</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Syrups">Syrups</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Baseline is ONLY shown when Adding New. Hidden on Counter Edit. */}
                                {modalMode === 'add' && (
                                    <div className="form-group">
                                        <label>Baseline Quantity (Per package)</label>
                                        <input 
                                            type="number" 
                                            name="baseline" 
                                            value={currentItem.baseline} 
                                            onChange={handleModalInputChange} 
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Current Stock (Quantity on hand)</label>
                                    <input 
                                        type="number" 
                                        name="quantity" 
                                        value={currentItem.quantity} 
                                        onChange={handleModalInputChange} 
                                        placeholder="e.g. 50"
                                    />
                                </div>

                                {/* Initial Back Stock only shown when creating a new item */}
                                {modalMode === 'add' && (
                                    <div className="form-group">
                                        <label>Initial Packages at Back</label>
                                        <input 
                                            type="number" 
                                            name="backStock" 
                                            value={currentItem.backStock} 
                                            onChange={handleModalInputChange} 
                                            placeholder="e.g. 5"
                                        />
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
                                <button type="button" className="save-btn" onClick={handleSaveModal}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;