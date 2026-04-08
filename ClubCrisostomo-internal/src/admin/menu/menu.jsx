import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase.js'; // <-- FIREBASE IMPORT
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'; // <-- FIRESTORE TOOLS
import './menu.css';

const Menu = () => {
    const navigate = useNavigate();
    
    // --- 1. CLOUD STATE & LIVE SYNC ---
    const [menuItems, setMenuItems] = useState([]);

    useEffect(() => {
        // Connect to the 'menu' collection in Firebase
        const menuCollection = collection(db, 'menu');
        const unsubscribe = onSnapshot(menuCollection, (snapshot) => {
            const menuData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setMenuItems(menuData);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("All categories"); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentItem, setCurrentItem] = useState({ name: '', price: '', cost: '', category: 'Coffee', availability: 'Available' });

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

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem({ ...currentItem, [name]: value });
    };

    // --- 2. CLOUD CRUD OPERATIONS ---
    const handleDeleteItem = async (id) => {
        if(window.confirm("Are you sure you want to delete this menu item?")) {
            await deleteDoc(doc(db, 'menu', id));
        }
    };

    const handleSaveModal = async (e) => {
        e.preventDefault();
        
        if (!currentItem.name || !currentItem.price) {
            alert("Please provide at least a name and a price.");
            return;
        }

        try {
            if (modalMode === 'add') {
                const newId = `MENU${Date.now()}`;
                await setDoc(doc(db, 'menu', newId), currentItem);
            } else {
                await updateDoc(doc(db, 'menu', currentItem.id), currentItem);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving menu item:", error);
            alert("Failed to save. Check console for details.");
        }
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
        <div className="dashboard-container">
            {/* --- ADMIN SIDEBAR (Matched to Dashboard) --- */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ color: '#c8a27c', margin: '20px 0', fontSize: '24px', letterSpacing: '1px' }}>CLUB C.</h2>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        <li onClick={() => handleNavigation('/admin')}><span className="icon">🏠</span> DashBoard</li>
                        <li onClick={() => handleNavigation('/admin/inventory')}><span className="icon">📦</span> Inventory</li>
                        <li className="active"><span className="icon">☕</span> Menu</li>
                        <li onClick={() => handleNavigation('/admin/staffs-management')}><span className="icon">👥</span> Staff</li>
                        <li onClick={() => handleNavigation('/admin/reports')}><span className="icon">📊</span> Reports</li>
                        <li onClick={() => handleNavigation('/admin/settingsadmin')}><span className="icon">⚙️</span> Settings</li>
                    </ul>
                </nav>
                <button className="logout-btn" onClick={() => handleNavigation('/')}>LogOut</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="page-header">
                    <div className="header-titles">
                        <h1>Menu Management</h1>
                        <p>Manage your menu items, category and availability below.</p>
                    </div>
                    <div className="header-actions">
                        <div className="search-bar">
                            <span className="search-icon"></span>
                            <input 
                                type="text" 
                                placeholder="Search menu items..." 
                                className="search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="add-btn" onClick={openAddModal}>+ Add items</button>
                    </div>
                </header>

                {/* CONTROLS & TABS */}
                <div className="menu-tabs">
                    {['All categories', 'Coffee', 'Non Coffee', 'Refreshers', 'Snacks'].map(tab => (
                        <span 
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`} 
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </span>
                    ))}
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
                                    <div className="menu-cost">Production Cost: ₱{item.cost}</div>
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
                                    ₱{item.price}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {filteredMenu.length === 0 && (
                        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--widget-dark)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.03)" }}>
                            {menuItems.length === 0 
                                ? "Your menu is currently empty. Click '+ Add items' to create one!" 
                                : "No items found matching your filter."}
                        </div>
                    )}
                </div>
            </main>

            {/* --- UNIFIED MODAL OVERLAY --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h2>{modalMode === 'add' ? 'Add New Menu Item' : 'Edit Menu Item'}</h2>
                        
                        <form onSubmit={handleSaveModal}>
                            <div className="form-group">
                                <label>Item Name</label>
                                <input required type="text" name="name" value={currentItem.name} onChange={handleModalInputChange} placeholder="e.g. Mocha" />
                            </div>

                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={currentItem.category} onChange={handleModalInputChange}>
                                    <option value="Coffee">Coffee</option>
                                    <option value="Non Coffee">Non Coffee</option>
                                    <option value="Refreshers">Refreshers</option>
                                    <option value="Snacks">Snacks</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Selling Price</label>
                                <input required type="number" name="price" value={currentItem.price} onChange={handleModalInputChange} placeholder="e.g. 150" />
                            </div>

                            <div className="form-group">
                                <label>Availability</label>
                                <select name="availability" value={currentItem.availability} onChange={handleModalInputChange}>
                                    <option value="Available">Available</option>
                                    <option value="Not Available">Not Available</option>
                                    <option value="Coming soon">Coming soon</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Production Cost</label>
                                <input type="number" name="cost" value={currentItem.cost} onChange={handleModalInputChange} placeholder="e.g. 45" />
                            </div>

                            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px' }}>
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    {modalMode === 'add' ? 'Add Item' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;