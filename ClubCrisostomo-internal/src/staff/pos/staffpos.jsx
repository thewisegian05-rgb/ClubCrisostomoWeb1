import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar.jsx';
import { db } from '../../firebase.js'; 
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore'; 
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

    useEffect(() => {
        // Automatically syncs the POS buttons with the Admin Menu!
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
            return [...prevCart, { ...activeModalItem, cartItemId, quantity: modalQuantity, temperature: modalTemperature, addOns: selectedAddOns }];
        });
        closeCustomizationModal(); 
    };

    const updateCartQuantity = (cartItemId, delta) => {
        setCart(prevCart => prevCart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
    };

    const removeFromCart = (cartItemId) => setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));

    const handleConfirmOrderClick = () => {
        if (cart.length === 0) return alert("Cart is empty! Add items before confirming.");
        setIsPaymentModalOpen(true);
    };

    // --- 2. CLOUD SAVING (TRANSACTIONS) ---
    const handleFinalCheckout = async () => {
        if (!isPaymentValid) return;

        const txnId = `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
        const newTxn = {
            id: txnId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(), // Great for sorting reports later
            orderType: orderType,
            items: cart.map(item => {
                const safeName = item.name || "Unnamed Item";
                const addOnsStr = item.addOns && item.addOns.length > 0 ? ` (+ ${item.addOns.map(a => `${a.qty}x ${a.name}`).join(', ')})` : '';
                return `${item.quantity}x ${safeName} (${item.temperature})${addOnsStr}`;
            }).join(' | '),
            total: totalAmountDue,
            totalDisplay: `₱${totalAmountDue.toFixed(2)}`,
            status: "Pending", // <--- THE FIX: This sends it to the Pending queue!
            staff: "Current User" 
        };

        try {
            // Save order directly to Firebase 'transactions' collection
            await setDoc(doc(db, 'transactions', txnId), newTxn);
            
            alert(`Payment successful!\nTotal: ₱${totalAmountDue.toFixed(2)}\nChange: ₱${changeAmount.toFixed(2)}\nOrder sent to kitchen.`);
            setCart([]); 
            setIsPaymentModalOpen(false); 
            setAmountTendered('');
        } catch (error) {
            console.error("Error saving transaction:", error);
            alert("Failed to process payment. Check connection.");
        }
    };

    const handlePayoutSubmit = async () => {
        const amount = parseFloat(payoutAmount);
        if (!amount || amount <= 0) return alert("Please enter a valid amount.");
        
        const finalReason = payoutReason === 'Others' ? payoutOtherReason : payoutReason;
        if (!finalReason.trim()) return alert("Please specify the reason for payout.");

        const outId = `OUT-${Math.floor(1000 + Math.random() * 9000)}`;
        const newPayout = {
            id: outId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(),
            orderType: 'Payout',
            items: `CASH PAYOUT: ${finalReason}`,
            total: -Math.abs(amount), // Negative for reports
            totalDisplay: `-₱${amount.toFixed(2)}`,
            status: "Payout", 
            staff: "Current User" 
        };

        try {
            // Save payout directly to Firebase 'transactions' collection
            await setDoc(doc(db, 'transactions', outId), newPayout);

            alert(`Payout of ₱${amount.toFixed(2)} recorded for ${finalReason}.`);
            setIsPayoutModalOpen(false); 
            setPayoutAmount(''); 
            setPayoutReason('Ice cubes'); 
            setPayoutOtherReason('');
        } catch (error) {
            console.error("Error saving payout:", error);
            alert("Failed to record payout. Check connection.");
        }
    };

    const categories = ['All', 'Coffee', 'Non Coffee', 'Refreshers', 'Snacks'];
    
    // Filter menu logic based on Firebase data
    const filteredMenu = menuItems.filter(item => {
        const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
        const safeName = item.name || ""; 
        const searchMatch = safeName.toLowerCase().includes(searchTerm.toLowerCase());
        return categoryMatch && searchMatch && item.availability !== "Not Available";
    });

    return (
        <div className="dashboard-container">
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

                        <div className="pos-grid">
                            {filteredMenu.length === 0 ? (
                                <div style={{gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)"}}>
                                    No active menu items found. Add them in the Admin Panel!
                                </div>
                            ) : (
                                filteredMenu.map(item => (
                                    <div className="pos-item-card" key={item.id} onClick={() => openCustomizationModal(item)}>
                                        <div className="item-image-placeholder">
                                            <span>{item.name ? item.name.charAt(0) : '?'}</span>
                                        </div>
                                        <div className="item-info">
                                            <h4>{item.name || "Unnamed Item"}</h4>
                                            <p>₱{parseFloat(item.price || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
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
                                            {item.addOns && item.addOns.length > 0 && (
                                                <div className="cart-item-addons-list">
                                                    {item.addOns.map((a, index) => <div key={index} className="cart-item-addon-line">+ {a.qty}x {a.name}</div>)}
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
                <div className="modal-overlay" onClick={closeCustomizationModal}>
                    <div className="modal-content pos-custom-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h2>{activeModalItem.name || "Item"}</h2>
                            <button className="close-btn-custom" onClick={closeCustomizationModal}>✖</button>
                        </div>
                        <div className="modal-body-custom">
                            <div className="form-group" style={{marginBottom: "20px"}}>
                                <label style={{color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "8px", display: "block"}}>Select Temperature</label>
                                <div className="temp-toggle-container">
                                    <button className={modalTemperature === 'Hot' ? 'active' : ''} onClick={() => setModalTemperature('Hot')}>Hot</button>
                                    <button className={modalTemperature === 'Iced' ? 'active' : ''} onClick={() => setModalTemperature('Iced')}>Iced</button>
                                </div>
                            </div>
                            <div className="addons-section">
                                <div className="addons-header-row">
                                    <h3>Add-ons (Extras)</h3>
                                    <span className="clear-all-btn" onClick={clearAllAddOns}>Clear All</span>
                                </div>
                                <div className="addons-list">
                                    {availableAddOns.map(addon => (
                                        <div className="addon-row" key={addon.id}>
                                            <span className="addon-name-txt">{addon.name}</span>
                                            <div className="addon-controls-wrapper">
                                                <div className="addon-stepper">
                                                    <button onClick={() => updateAddOnCount(addon.id, -1)}>−</button>
                                                    <span>{modalAddOnCounts[addon.id] || 0}</span>
                                                    <button onClick={() => updateAddOnCount(addon.id, 1)}>+</button>
                                                </div>
                                                <span className="addon-price-txt">₱{addon.price}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="addons-section" style={{marginTop: "20px"}}>
                                <div className="addon-row" style={{backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)"}}>
                                    <span className="addon-name-txt" style={{color: "var(--text-accent)"}}>Item Quantity</span>
                                    <div className="addon-stepper">
                                        <button onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>−</button>
                                        <span>{modalQuantity}</span>
                                        <button onClick={() => setModalQuantity(modalQuantity + 1)}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer-custom">
                            <div className="modal-total-display">
                                <span>TOTAL</span>
                                <div className="total-badge-amount">₱{getModalItemTotal().toFixed(2)}</div>
                            </div>
                            <button className="add-to-cart-btn" onClick={confirmAddToOrder}>Add to Cart</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAYMENT MODAL --- */}
            {isPaymentModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
                    <div className="modal-content pos-custom-modal" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h2>Complete Payment</h2>
                            <button className="close-btn-custom" onClick={() => setIsPaymentModalOpen(false)}>✖</button>
                        </div>
                        <div className="modal-body-custom" style={{ padding: "20px 30px" }}>
                            <div style={{ textAlign: "center", marginBottom: "25px" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", letterSpacing: "1px" }}>TOTAL DUE</span>
                                <h1 style={{ color: "var(--text-accent)", fontSize: "3rem", margin: "5px 0 0 0" }}>₱{totalAmountDue.toFixed(2)}</h1>
                            </div>
                            <div className="form-group" style={{ marginBottom: "20px" }}>
                                <label style={{ color: "var(--text-main)", fontSize: "1rem", marginBottom: "10px", textAlign: "center", display: "block" }}>Amount Received</label>
                                <input type="number" className="payment-input" placeholder="0.00" value={amountTendered} onChange={(e) => setAmountTendered(e.target.value)} autoFocus />
                            </div>
                            <div className="change-display-box">
                                <span className="change-label">Change Due:</span>
                                <span className="change-amount" style={{ color: changeAmount >= 0 ? "#4caf50" : "#ef5350" }}>
                                    {amountTendered === '' ? '₱0.00' : `₱${changeAmount > 0 ? changeAmount.toFixed(2) : '0.00'}`}
                                </span>
                            </div>
                        </div>
                        <div className="modal-footer-custom" style={{ justifyContent: "center" }}>
                            <button className="add-to-cart-btn" style={{ width: "100%", fontSize: "1.2rem", padding: "15px", opacity: isPaymentValid ? 1 : 0.5, cursor: isPaymentValid ? "pointer" : "not-allowed" }} onClick={handleFinalCheckout} disabled={!isPaymentValid}>
                                Pay ₱{totalAmountDue.toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PAID OUT (PETTY CASH) MODAL --- */}
            {isPayoutModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPayoutModalOpen(false)}>
                    <div className="modal-content pos-custom-modal" style={{ width: "400px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-custom">
                            <h2>💸 Record Expenses</h2>
                            <button className="close-btn-custom" onClick={() => setIsPayoutModalOpen(false)}>✖</button>
                        </div>
                        <div className="modal-body-custom" style={{ padding: "20px 30px" }}>
                            
                            <div className="form-group" style={{ marginBottom: "20px" }}>
                                <label style={{ color: "var(--text-main)", fontSize: "1rem", marginBottom: "10px", display: "block" }}>Amount Taken (₱)</label>
                                <input type="number" className="payment-input" style={{fontSize: "2rem"}} placeholder="0.00" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} autoFocus />
                            </div>

                            <div className="form-group" style={{ marginBottom: "20px" }}>
                                <label style={{ color: "var(--text-main)", fontSize: "1rem", marginBottom: "10px", display: "block" }}>Reason</label>
                                <div className="payout-reasons-grid">
                                    {['Ice cubes', 'Water gallons', 'Dish washing', 'Others'].map(reason => (
                                        <button 
                                            key={reason} 
                                            className={`payout-reason-btn ${payoutReason === reason ? 'active' : ''}`}
                                            onClick={() => setPayoutReason(reason)}
                                        >
                                            {reason}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {payoutReason === 'Others' && (
                                <div className="form-group">
                                    <label style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "5px", display: "block" }}>Specify Reason</label>
                                    <input 
                                        type="text" 
                                        className="payment-input" 
                                        style={{fontSize: "1rem", padding: "12px", textAlign: "left"}}
                                        placeholder="e.g. Hardware supplies..." 
                                        value={payoutOtherReason} 
                                        onChange={(e) => setPayoutOtherReason(e.target.value)} 
                                    />
                                </div>
                            )}

                        </div>
                        <div className="modal-footer-custom" style={{ justifyContent: "center", gap: "10px" }}>
                            <button className="modal-action-btn outline" style={{flex: 1}} onClick={() => setIsPayoutModalOpen(false)}>Cancel</button>
                            <button className="add-to-cart-btn" style={{ flex: 1, backgroundColor: "#ef5350", color: "#fff" }} onClick={handlePayoutSubmit}>
                                Confirm Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPOS;