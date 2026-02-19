const totalAmountDiv = document.getElementById("totalAmount");
const payAmountSpan = document.getElementById("payAmount");
const paymentForm = document.getElementById("paymentForm");
const cardDetails = document.getElementById("cardDetails");
const gcashQR = document.getElementById("gcashQR");
const payBtn = document.querySelector(".pay-btn"); // pay button

// Notification function
function showNotification(message, type = "info", duration = 4000) {
    const container = document.getElementById("notification-container");
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.innerHTML = `${message} <span class="close-btn">&times;</span>`;

    container.appendChild(notif);

    // Close button
    notif.querySelector(".close-btn").addEventListener("click", () => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    });

    // Auto-dismiss
    setTimeout(() => {
        notif.style.animation = "fadeOut 0.5s forwards";
        setTimeout(() => notif.remove(), 500);
    }, duration);
}

// Load cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Calculate total
function calculateTotal() {
    let total = 0;
    cart.forEach(item => {
        let itemTotal = item.basePrice;
        if (item.addons) {
            item.addons.forEach(a => itemTotal += a.price * a.qty);
        }
        total += itemTotal;
    });
    return total;
}

let total = calculateTotal();
totalAmountDiv.textContent = `₱${total}`;
payAmountSpan.textContent = `₱${total}`;

// Show/Hide Card Details & GCash QR, toggle Pay button
document.querySelectorAll("input[name='paymentMethod']").forEach(radio => {
    radio.addEventListener("change", function() {
        if (this.value === "card") {
            cardDetails.style.display = "block";
            gcashQR.style.display = "none";
            payBtn.style.display = "block";
        } else if (this.value === "ewallet") {
            gcashQR.style.display = "block";
            cardDetails.style.display = "none";
            payBtn.style.display = "none"; // hide pay button for e-wallet
        } else { // counter
            cardDetails.style.display = "none";
            gcashQR.style.display = "none";
            payBtn.style.display = "block";
        }
    });
});

// GCash QR click - simulate scanning
gcashQR.addEventListener("click", () => {
    // Show success notification
    showNotification("Payment received via GCash/Maya!", "success");

    // Clear cart
    localStorage.removeItem("cart");

    // Show redirect notification after 2s
    setTimeout(() => {
        showNotification("Redirecting to Menu page...", "info", 3000);
    }, 2000);

    // Redirect after 3.5s
    setTimeout(() => window.location.href = "Menu.html", 3500);
});

// Handle Card and Counter Payments
paymentForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const selectedMethod = document.querySelector("input[name='paymentMethod']:checked").value;

    if (selectedMethod === "counter") {
        showNotification("Order placed! Please pay at the counter.", "success");
        localStorage.removeItem("cart");

        // After 2s, show redirect notification
        setTimeout(() => {
            showNotification("Redirecting to Menu page...", "info", 3000);
        }, 2000);

        setTimeout(() => window.location.href = "Menu.html", 3500);
    } else if (selectedMethod === "card") {
        const cardNumber = document.getElementById("cardNumber").value.trim();
        const expiry = document.getElementById("expiry").value.trim();
        const cvv = document.getElementById("cvv").value.trim();

        if (cardNumber.length !== 16 || isNaN(cardNumber)) {
            showNotification("Invalid card number.", "error");
            return;
        }

        if (cvv.length !== 3 || isNaN(cvv)) {
            showNotification("Invalid CVV.", "error");
            return;
        }

        if (!expiry.includes("/")) {
            showNotification("Invalid expiry date.", "error");
            return;
        }

        showNotification("Card Payment Successful!", "success");
        localStorage.removeItem("cart");

        // After 2s, show redirect notification
        setTimeout(() => {
            showNotification("Redirecting to Menu page...", "info", 3000);
        }, 2000);

        setTimeout(() => window.location.href = "Menu.html", 3500);
    }
});
