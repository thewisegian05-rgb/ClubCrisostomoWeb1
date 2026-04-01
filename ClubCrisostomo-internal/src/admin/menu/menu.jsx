import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './menu.css';

// Updated Mock Data
const INITIAL_MENU_DATA = [
    { id: 1, name: "Espresso", category: "Coffee", availability: "Available", cost: "10", price: "90" },
    { id: 2, name: "Matcha Latte", category: "Non Coffee", availability: "Available", cost: "30", price: "120" },
    { id: 3, name: "Berry Lemonade", category: "Refreshers", availability: "Available", cost: "40", price: "150" },
    { id: 4, name: "Chocolate Chip Cookie", category: "Snacks", availability: "Available", cost: "10", price: "100" },
];

const Menu = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [menuItems, setMenuItems] = useState(() => {
        const savedMenu = localStorage.getItem("clubC_menu");
        return savedMenu ? JSON.parse(savedMenu) : INITIAL_MENU_DATA;
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("All categories"); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentItem, setCurrentItem] = useState({ name: '', price: '', cost: '', category: 'Coffee', availability: 'Available' });

    useEffect(() => {
        localStorage.setItem("clubC_menu", JSON.stringify(menuItems));
    }, [menuItems]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    // --- MODAL & BUTTON FUNCTIONALITY ---
    const openAddModal = () => {
        setModalMode('add');
        const defaultCategory = activeTab === 'All categories' ? 'Coffee' : activeTab;
        setCurrentItem({ name: '', price: '', cost: '', category: defaultCategory, availability: 'Available' });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
        setCurrentItem({ ...item });
        setIsModalOpen(true);
    };

    const handleDeleteItem = (id) => {
        if(window.confirm("Are you sure you want to delete this menu item?")) {
            setMenuItems(menuItems.filter(item => item.id !== id));
        }
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem({ ...currentItem, [name]: value });
    };

    const handleSaveModal = () => {
        if (!currentItem.name || !currentItem.price) {
            alert("Please provide at least a name and a price.");
            return;
        }

        if (modalMode === 'add') {
            const newItem = { ...currentItem, id: Date.now() };
            setMenuItems([...menuItems, newItem]);
        } else {
            setMenuItems(menuItems.map(item => item.id === currentItem.id ? currentItem : item));
        }
        
        setIsModalOpen(false);
    };

    // --- FILTER LOGIC ---
    const filteredMenu = menuItems.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === "All categories" || item.category === activeTab;
        
        return matchesSearch && matchesTab;
    });

    // Helper for dynamic dot colors based on availability
    const getDotColor = (status) => {
        if (status === 'Available') return '#81c784'; 
        if (status === 'Not Available') return '#ef5350'; 
        if (status === 'Coming soon') return '#ffb74d'; 
        return '#81c784';
    };

    return (
        <div className="menu-dashboard-container">
            <div className="top-bar">
                <h2>CLUB C.</h2>
            </div>

            <div className="menu-layout">
                {/* --- SIDEBAR --- */}
                <aside className="menu-sidebar">
                    <div className="sidebar-title">
                        <h2>CLUB C.</h2>
                    </div>
                    <nav className="menu-sidebar-nav">
                        <ul>
                            <li onClick={() => handleNavigation('/admin')}>
                                <span className="icon">🏠</span> DashBoard
                            </li>
                            <li onClick={() => handleNavigation('/admin/inventory')}>
                                <span className="icon">📦</span> Inventory
                            </li>
                            <li className="active">
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
                    <button className="menu-logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
                </aside>

                {/* MAIN CONTENT */}
                <main className="menu-main-content">
                    <header className="menu-header">
                        <div className="menu-header-titles">
                            <h1>Menu Management</h1>
                            <p>Manage your menu items, category and availability below.</p>
                        </div>
                        <div className="menu-header-actions">
                            <input 
                                type="text" 
                                placeholder="Search menu items" 
                                className="menu-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="add-btn-group">
                                <button className="menu-add-btn" onClick={openAddModal} style={{ borderRadius: '6px' }}>+ Add items</button>
                            </div>
                        </div>
                    </header>

                    {/* CONTROLS & TABS */}
                    <div className="menu-controls-section">
                        <div className="menu-tabs">
                            <span className={`tab ${activeTab === 'All categories' ? 'active' : ''}`} onClick={() => setActiveTab('All categories')}>All categories</span>
                            <span className={`tab ${activeTab === 'Coffee' ? 'active' : ''}`} onClick={() => setActiveTab('Coffee')}>Coffee</span>
                            <span className={`tab ${activeTab === 'Non Coffee' ? 'active' : ''}`} onClick={() => setActiveTab('Non Coffee')}>Non Coffee</span>
                            <span className={`tab ${activeTab === 'Refreshers' ? 'active' : ''}`} onClick={() => setActiveTab('Refreshers')}>Refreshers</span>
                            <span className={`tab ${activeTab === 'Snacks' ? 'active' : ''}`} onClick={() => setActiveTab('Snacks')}>Snacks</span>
                        </div>
                    </div>

                    {/* MENU LIST */}
                    <div className="menu-list-container">
                        {filteredMenu.map((item) => (
                            <div className="menu-card" key={item.id}>
                                <div className="menu-card-left">
                                    <div className="menu-picture-placeholder">Picture</div>
                                    <div className="menu-details">
                                        <h3>{item.name}</h3>
                                        <div className="menu-availability">
                                            <span className="availability-dot" style={{ backgroundColor: getDotColor(item.availability) }}></span>
                                            <span className="availability-text">{item.availability}</span>
                                        </div>
                                        <div className="menu-cost">Production Cost: {item.cost}</div>
                                    </div>
                                </div>
                                <div className="menu-card-right">
                                    <div className="menu-actions">
                                        <button className="edit-btn" onClick={() => openEditModal(item)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>Delete</button>
                                    </div>
                                    <div className="menu-price">
                                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal', marginRight: '8px' }}>
                                            Selling Price:
                                        </span>
                                        {item.price}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {filteredMenu.length === 0 && (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--widget-dark)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                No items found in this category. Click "+ Add items" to create one!
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* --- UNIFIED MODAL OVERLAY --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h2>{modalMode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}</h2>
                        
                        <div className="form-group">
                            <label>Item Name</label>
                            <input type="text" name="name" value={currentItem.name} onChange={handleModalInputChange} placeholder="e.g. Mocha" />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select 
                                name="category" 
                                value={currentItem.category} 
                                onChange={handleModalInputChange}
                            >
                                <option value="Coffee">Coffee</option>
                                <option value="Non Coffee">Non Coffee</option>
                                <option value="Refreshers">Refreshers</option>
                                <option value="Snacks">Snacks</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Selling Price</label>
                            <input type="text" name="price" value={currentItem.price} onChange={handleModalInputChange} placeholder="e.g. 150" />
                        </div>

                        <div className="form-group">
                            <label>Availability</label>
                            <select 
                                name="availability" 
                                value={currentItem.availability} 
                                onChange={handleModalInputChange}
                            >
                                <option value="Available">Available</option>
                                <option value="Not Available">Not Available</option>
                                <option value="Coming soon">Coming soon</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Production Cost</label>
                            <input type="text" name="cost" value={currentItem.cost} onChange={handleModalInputChange} placeholder="e.g. 45" />
                        </div>

                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="save-btn" onClick={handleSaveModal}>
                                {modalMode === 'add' ? 'Add Item' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;