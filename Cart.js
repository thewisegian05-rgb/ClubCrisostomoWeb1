const cartItemsDiv = document.getElementById("cartItems");
const totalAmountDiv = document.getElementById("totalAmount");

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Render cart items
function renderCart() {
    cartItemsDiv.innerHTML = "";

    cart.forEach((item, index) => {
        const card = document.createElement("div");
        card.classList.add("cart-card");

        let addonsHtml = "";
        if(item.addons && item.addons.length > 0){
            addonsHtml = "<ul>";
            item.addons.forEach(a => {
                addonsHtml += `<li>${a.name} x${a.qty} - ₱${a.price * a.qty}</li>`;
            });
            addonsHtml += "</ul>";
        }

        card.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>₱${item.basePrice}</p>
                ${addonsHtml}
            </div>
            <div class="qty">
                <button class="minus">-</button>
                <span class="count">1</span>
                <button class="plus">+</button>
            </div>
            <button class="remove-btn">Remove</button>
        `;

        cartItemsDiv.appendChild(card);

        const minus = card.querySelector(".minus");
        const plus = card.querySelector(".plus");
        const countEl = card.querySelector(".count");
        const removeBtn = card.querySelector(".remove-btn");

        minus.onclick = () => {
            if(Number(countEl.textContent) > 1){
                countEl.textContent = Number(countEl.textContent) - 1;
                updateTotal();
            }
        };

        plus.onclick = () => {
            countEl.textContent = Number(countEl.textContent) + 1;
            updateTotal();
        };

        removeBtn.onclick = () => {
            cart.splice(index, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            renderCart();
        };
    });

    updateTotal();
}

// Update total amount
function updateTotal() {
    let total = 0;
    cart.forEach((item, i) => {
        const card = document.querySelectorAll(".cart-card")[i];
        const qty = Number(card.querySelector(".count").textContent);
        let itemTotal = item.basePrice;
        if(item.addons){
            item.addons.forEach(a => itemTotal += a.price * a.qty);
        }
        total += itemTotal * qty;
    });

    totalAmountDiv.textContent = `₱${total}`;
}

// Initial render
renderCart();
