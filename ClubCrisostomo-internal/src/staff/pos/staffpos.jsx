import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import { db } from '../../firebase.js'; 
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import './staffpos.css'; 

const availableAddOns = [
    { id: 'a1', name: 'Espresso', price: 40 },
    { id: 'a2', name: 'Syrup', price: 30 },
    { id: 'a3', name: 'Nata Jelly', price: 15 },
    { id: 'a4', name: 'Cereal', price: 25 },
];

const StaffPOS = () => {
    // --- 1. CLOUD STATE (MENU) ---
    const [menuItems, setMenuItems] = useState([]);

    // --- POS WORKFLOW SETTINGS ---
    // Read directly from localStorage on load so it applies instantly
    const [viewMode, setViewMode] = useState(localStorage.getItem('pos_menu_view') || 'Grid View (Images)');

    useEffect(() => {
        const menuCollection = collection(db, 'menu');
        const unsubscribe = onSnapshot(menuCollection, (snapshot) => {
            const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMenuItems(menuData);
        });

        return () => unsubscribe();
    }, []);

    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Cart State
    const [cart, setCart] = useState([]);
    const [orderType, setOrderType] = useState('Dine In');

    // --- NOTIFICATION TOAST STATE ---
    const [notification, setNotification] = useState({ show: false, message: "", isError: false });

    const showNotification = (message, isError = false) => {
        setNotification({ show: true, message, isError });
        setTimeout(() => setNotification({ show: false, message: "", isError: false }), 3000);
    };

    // --- MODAL STATES ---
    const [activeModalItem, setActiveModalItem] = useState(null);
    const [modalQuantity, setModalQuantity] = useState(1);
    const [modalTemperature, setModalTemperature] = useState('Hot');
    const [modalAddOnCounts, setModalAddOnCounts] = useState({});

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [amountTendered, setAmountTendered] = useState('');

    // --- PAYOUT (PETTY CASH) STATE ---
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutReason, setPayoutReason] = useState('Ice cubes');
    const [payoutOtherReason, setPayoutOtherReason] = useState('');

    // --- CALCULATIONS ---
    const calculateItemLineTotal = (item) => {
        const basePrice = parseFloat(item.price) || 0;
        const addOnsPrice = item.addOns ? item.addOns.reduce((sum, a) => sum + (a.price * a.qty), 0) : 0;
        return (basePrice + addOnsPrice) * item.quantity;
    };

    const calculateSubtotal = () => {
        return cart.reduce((total, item) => total + calculateItemLineTotal(item), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal(); 
    };

    const totalAmountDue = calculateTotal();
    const tenderedNumber = parseFloat(amountTendered) || 0;
    const changeAmount = tenderedNumber - totalAmountDue;
    const isPaymentValid = tenderedNumber >= totalAmountDue;

    // --- HANDLERS ---
    const openCustomizationModal = (item) => {
        setActiveModalItem(item);
        setModalQuantity(1);
        setModalTemperature('Hot');
        setModalAddOnCounts({});
    };

    const closeCustomizationModal = () => setActiveModalItem(null);

    const updateAddOnCount = (addonId, delta) => {
        setModalAddOnCounts(prev => ({ ...prev, [addonId]: Math.max(0, (prev[addonId] || 0) + delta) }));
    };

    const clearAllAddOns = () => setModalAddOnCounts({});

    const getModalItemTotal = () => {
        if (!activeModalItem) return 0;
        const basePrice = parseFloat(activeModalItem.price) || 0;
        let addOnsPrice = 0;
        availableAddOns.forEach(addon => addOnsPrice += (addon.price * (modalAddOnCounts[addon.id] || 0)));
        return (basePrice + addOnsPrice) * modalQuantity;
    };

    const confirmAddToOrder = () => {
        const selectedAddOns = availableAddOns.filter(a => (modalAddOnCounts[a.id] || 0) > 0).map(a => ({ ...a, qty: modalAddOnCounts[a.id] }));
        const addOnsString = selectedAddOns.map(a => `${a.id}x${a.qty}`).sort().join('-');
        const cartItemId = `${activeModalItem.id}-${modalTemperature}-${addOnsString}`;

        setCart(prevCart => {
            const existingItem = prevCart.find(c => c.cartItemId === cartItemId);
            if (existingItem) return prevCart.map(c => c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + modalQuantity } : c);
            
            const formattedItem = {
                ...activeModalItem,
                cartItemId,
                quantity: modalQuantity,
                temperature: modalTemperature,
                addons: selectedAddOns, 
                total: getModalItemTotal()
            };
            
            return [...prevCart, formattedItem];
        });
        closeCustomizationModal(); 
    };

    const updateCartQuantity = (cartItemId, delta) => {
        setCart(prevCart => prevCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    };

    const removeFromCart = (cartItemId) => setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));

    const handleConfirmOrderClick = () => {
        if (cart.length === 0) return showNotification("Cart is empty! Add items first.", true);
        setIsPaymentModalOpen(true);
    };

    const handleFinalCheckout = async () => {
        if (!isPaymentValid) return;

        const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const newTxn = {
            receiptId: txnId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: serverTimestamp(),
            orderType: orderType,
            items: cart, 
            totalAmount: totalAmountDue,
            status: "Pending", 
            customerName: "Walk-in (POS)",
            paymentMethod: "Cash",
            staff: "Current User" 
        };

        try {
            await setDoc(doc(db, 'orders', txnId), newTxn);
            
            showNotification(`Payment successful! Change: ₱${changeAmount.toFixed(2)}`);
            
            setCart([]); 
            setIsPaymentModalOpen(false); 
            setAmountTendered('');
        } catch (error) {
            console.error("Error saving transaction:", error);
            showNotification("Failed to process payment. Check connection.", true);
        }
    };

    const handlePayoutSubmit = async () => {
        const amount = parseFloat(payoutAmount);
        if (!amount || amount <= 0) return showNotification("Please enter a valid amount.", true);
        
        const finalReason = payoutReason === 'Others' ? payoutOtherReason : payoutReason;
        if (!finalReason.trim()) return showNotification("Please specify the reason for payout.", true);

        const outId = `OUT-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const newPayout = {
            receiptId: outId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: serverTimestamp(),
            orderType: 'Payout',
            items: `CASH PAYOUT: ${finalReason}`, 
            totalAmount: -Math.abs(amount), 
            status: "Payout", 
            customerName: "System",
            staff: "Current User" 
        };

        try {
            await setDoc(doc(db, 'orders', outId), newPayout);

            showNotification(`Payout of ₱${amount.toFixed(2)} recorded.`);
            
            setIsPayoutModalOpen(false); 
            setPayoutAmount(''); 
            setPayoutReason('Ice cubes'); 
            setPayoutOtherReason('');
        } catch (error) {
            console.error("Error saving payout:", error);
            showNotification("Failed to record payout. Check connection.", true);
        }
    };

    const categories = ['All', 'Coffee', 'Non Coffee', 'Refreshers', 'Snacks'];
    
    const filteredMenu = menuItems.filter(item => {
        const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
        const safeName = item.name || ""; 
        const searchMatch = safeName.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch && item.availability !== "Not Available";
    });

    return (
        <div className="dashboard-container">
            
            {notification.show && (
                <div className="pos-notification pos-animate-pop">
                    <div className={`pos-notif-content ${notification.isError ? 'error' : ''}`}>
                        <span className="pos-notif-icon">{notification.isError ? '!' : '✓'}</span>
                        {notification.message}
                    </div>
                </div>
            )}

            <Sidebar />
            <main className="main-content">
                
                <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <h1 style={{margin: 0}}>Point of Sale 🛒</h1>
                        <button className="payout-btn" onClick={() => setIsPayoutModalOpen(true)}>💸 Expenses</button>
                    </div>
                    <div className="pos-search">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </header>

                <div className="pos-main-layout">
                    <div className="pos-menu-widget">
                        <div className="pos-categories">
                            {categories.map(cat => (
                                <button key={cat} className={`cat-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* --- DYNAMIC MENU VIEW RENDERING --- */}
                        <div className={viewMode === 'List View (Text)' ? "pos-list-view" : "pos-grid"}>
                            {filteredMenu.length === 0 ? (
                                <div style={{gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)"}}>
                                    No active menu items found. Add them in the Admin Panel!
                                </div>
                            ) : (
                                filteredMenu.map(item => (
                                    viewMode === 'List View (Text)' ? (
                                        // LIST VIEW LAYOUT
                                        <div className="pos-list-item-card" key={item.id} onClick={() => openCustomizationModal(item)}>
                                            <div className="item-info-row">
                                                <h4>{item.name || "Unnamed Item"}</h4>
                                                <p>₱{parseFloat(item.price || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        // DEFAULT GRID VIEW LAYOUT
                                        <div className="pos-item-card" key={item.id} onClick={() => openCustomizationModal(item)}>
                                            <div className="item-image-placeholder">
                                                <span>{item.name ? item.name.charAt(0) : '?'}</span>
                                            </div>
                                            <div className="item-info">
                                                <h4>{item.name || "Unnamed Item"}</h4>
                                                <p>₱{parseFloat(item.price || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pos-cart-widget">
                        <div className="cart-header">
                            <h3 style={{ margin: "0 0 15px 0", color: "var(--text-accent)" }}>Current Order</h3>
                            <div className="order-type-toggle">
                                <button className={orderType === 'Dine In' ? 'active' : ''} onClick={() => setOrderType('Dine In')}>Dine In</button>
                                <button className={orderType === 'Takeout' ? 'active' : ''} onClick={() => setOrderType('Takeout')}>Takeout</button>
                            </div>
                        </div>

                        <div className="cart-items">
                            {cart.length === 0 ? <div className="empty-cart">Cart is empty</div> : (
                                cart.map(item => (
                                    <div className="cart-item" key={item.cartItemId}>
                                        <div className="cart-item-details">
                                            <h4>{item.name || "Item"} <span style={{fontSize: "0.8rem", color: "var(--text-muted)"}}>({item.temperature})</span></h4>
                                            {item.addons && item.addons.length > 0 && (
                                                <div className="cart-item-addons-list">
                                                    {item.addons.map((a, index) => <div key={index} className="cart-item-addon-line">+ {a.qty}x {a.name}</div>)}
                                                </div>
                                            )}
                                            <p>₱{parseFloat(item.price || 0).toFixed(2)} Base</p>
                                        </div>
                                        <div className="cart-item-controls">
                                            <button className="qty-btn" onClick={() => updateCartQuantity(item.cartItemId, -1)}>-</button>
                                            <span className="qty-display">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateCartQuantity(item.cartItemId, 1)}>+</button>
                                        </div>
                                        <div className="cart-item-total">₱{calculateItemLineTotal(item).toFixed(2)}</div>
                                        <button className="remove-btn" onClick={() => removeFromCart(item.cartItemId)}>×</button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="cart-summary">
                            <div className="summary-row"><span>Subtotal</span><span>₱{calculateSubtotal().toFixed(2)}</span></div>
                            <div className="summary-row total-row"><span>Total</span><span>₱{totalAmountDue.toFixed(2)}</span></div>
                            <button className="checkout-btn" onClick={handleConfirmOrderClick}>Confirm Order</button>
                        </div>
                    </div>
                </div>
            </main>

            {/* --- CUSTOMIZATION MODAL --- */}
            {activeModalItem && (
                <div className="pos-modal-overlay show" onClick={closeCustomizationModal}>
                    <div className="pos-modal-box" onClick={(e) => e.stopPropagation()}>
                        <button className="pos-close-btn" onClick={closeCustomizationModal}>&times;</button>
                        <h3 className="pos-modal-title">{activeModalItem.name || "Item"}</h3>
                        
                        <div className="pos-temp-selection">
                            <p>Select Temperature</p>
                            <div className="pos-temp-toggle">
                                <span className={`pos-selection-slider ${modalTemperature.toLowerCase()}`}></span>
                                <button 
                                    className={`pos-temp-btn ${modalTemperature === 'Hot' ? 'active' : ''}`} 
                                    onClick={() => setModalTemperature('Hot')}
                                >Hot</button>
                                <button 
                                    className={`pos-temp-btn ${modalTemperature === 'Iced' ? 'active' : ''}`} 
                                    onClick={() => setModalTemperature('Iced')}
                                >Iced</button>
                            </div>
                        </div>

                        <div className="pos-addon-header-row">
                            <h4>Add-ons (Extras)</h4>
                            <button className="pos-clear-link" onClick={clearAllAddOns}>Clear All</button>
                        </div>
                        
                        <div className="pos-addons-list">
                            {availableAddOns.map(addon => (
                                <div className="pos-addon-row" key={addon.id}>
                                    <span className="pos-addon-name">{addon.name}</span>
                                    <div className="pos-addon-controls-wrapper">
                                        <span className="pos-addon-price">₱{addon.price}</span>
                                        <div className="pos-qty-controls">
                                            <button onClick={() => updateAddOnCount(addon.id, -1)}>−</button>
                                            <span className="pos-count">{modalAddOnCounts[addon.id] || 0}</span>
                                            <button onClick={() => updateAddOnCount(addon.id, 1)}>+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pos-addon-row" style={{ marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #333' }}>
                                <span className="pos-addon-name" style={{ color: '#C8A27C', fontWeight: '600' }}>Item Quantity</span>
                                <div className="pos-addon-controls-wrapper">
                                    <div className="pos-qty-controls">
                                        <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>−</button>
                                        <span className="pos-count">{modalQuantity}</span>
                                        <button onClick={() => setModalQuantity(modalQuantity + 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pos-modal-footer">
                            <div className="pos-total-display">
                                <span className="pos-total-label">TOTAL</span>
                                <strong className="pos-total-amount">₱{getModalItemTotal().toFixed(2)}</strong>
                            </div>
                            <button className="pos-add-cart-btn" onClick={confirmAddToOrder}>Add to Cart</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAYMENT MODAL --- */}
            {isPaymentModalOpen && (
                <div className="pos-modal-overlay show" onClick={() => setIsPaymentModalOpen(false)}>
                    <div className="pos-modal-box" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <button className="pos-close-btn" onClick={() => setIsPaymentModalOpen(false)}>&times;</button>
                        <h3 className="pos-modal-title">Complete Payment</h3>
                        
                        <div style={{ textAlign: "center", margin: "25px 0" }}>
                            <span style={{ color: "#888", fontSize: "0.8rem", letterSpacing: "1px" }}>TOTAL DUE</span>
                            <h1 style={{ color: "#fff", fontSize: "3rem", margin: "5px 0 0 0" }}>₱{totalAmountDue.toFixed(2)}</h1>
                        </div>
                        
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "10px", display: "block", textAlign: "center" }}>Amount Received</label>
                            <input 
                                type="number" 
                                className="pos-payment-input" 
                                placeholder="0.00" 
                                value={amountTendered} 
                                onChange={(e) => setAmountTendered(e.target.value)} 
                                autoFocus 
                            />
                        </div>
                        
                        <div className="pos-change-display">
                            <span>Change Due:</span>
                            <span style={{ color: changeAmount >= 0 ? "#4caf50" : "#ef5350", fontWeight: "600" }}>
                                {amountTendered === '' ? '₱0.00' : `₱${changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}`}
                            </span>
                        </div>
                        
                        <div className="pos-modal-footer" style={{ borderTop: "none", paddingTop: "0", justifyContent: "center" }}>
                            <button 
                                className="pos-add-cart-btn" 
                                style={{ width: "100%", fontSize: "1.2rem", padding: "15px", opacity: isPaymentValid ? 1 : 0.5, cursor: isPaymentValid ? "pointer" : "not-allowed" }} 
                                onClick={handleFinalCheckout} 
                                disabled={!isPaymentValid}
                            >
                                Pay ₱{totalAmountDue.toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAID OUT (PETTY CASH) MODAL --- */}
            {isPayoutModalOpen && (
                <div className="pos-modal-overlay show" onClick={() => setIsPayoutModalOpen(false)}>
                    <div className="pos-modal-box" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <button className="pos-close-btn" onClick={() => setIsPayoutModalOpen(false)}>&times;</button>
                        <h3 className="pos-modal-title">💸 Record Expenses</h3>
                        
                        <div style={{ marginBottom: "20px", marginTop: "15px" }}>
                            <label style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "10px", display: "block" }}>Amount Taken (₱)</label>
                            <input 
                                type="number" 
                                className="pos-payment-input" 
                                style={{fontSize: "2rem", padding: "10px", textAlign: "left"}} 
                                placeholder="0.00" 
                                value={payoutAmount} 
                                onChange={(e) => setPayoutAmount(e.target.value)} 
                                autoFocus 
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "10px", display: "block" }}>Reason</label>
                            <div className="pos-payout-reasons-grid">
                                {['Ice cubes', 'Water gallons', 'Dish washing', 'Others'].map(reason => (
                                    <button 
                                        key={reason} 
                                        className={`pos-reason-btn ${payoutReason === reason ? 'active' : ''}`}
                                        onClick={() => setPayoutReason(reason)}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {payoutReason === 'Others' && (
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "5px", display: "block" }}>Specify Reason</label>
                                <input 
                                    type="text" 
                                    className="pos-payment-input" 
                                    style={{fontSize: "1rem", padding: "12px", textAlign: "left"}}
                                    placeholder="e.g. Hardware supplies..." 
                                    value={payoutOtherReason} 
                                    onChange={(e) => setPayoutOtherReason(e.target.value)} 
                                />
                            </div>
                        )}

                        <div className="pos-modal-footer" style={{ borderTop: "none", paddingTop: "0", gap: "10px", display: "flex" }}>
                            <button 
                                className="pos-add-cart-btn" 
                                style={{ flex: 1, backgroundColor: "transparent", color: "#888", border: "1px solid #444" }} 
                                onClick={() => setIsPayoutModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="pos-add-cart-btn" 
                                style={{ flex: 1, backgroundColor: "#ef5350", color: "#fff" }} 
                                onClick={handlePayoutSubmit}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPOS;