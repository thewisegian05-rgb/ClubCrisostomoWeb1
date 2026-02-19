/* -------- VARIABLES -------- */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const modalName = document.getElementById("modalName");
const modalDesc = document.getElementById("modalDesc");
const totalPrice = document.getElementById("totalPrice");
let basePrice = 0;

/* -------- LOAD CART COUNT -------- */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    document.getElementById("cartCount").textContent = cart.length;
}
updateCartCount();

/* -------- OPEN MODAL -------- */
document.querySelectorAll(".menu-card").forEach(card => {
    card.onclick = () => {
        basePrice = Number(card.dataset.price);
        modalImg.src = card.dataset.img;
        modalName.textContent = card.dataset.name;
        modalDesc.textContent = card.dataset.desc;

        // Reset add-ons quantity
        document.querySelectorAll(".addon .count").forEach(c => c.textContent = 0);
        updateTotal();
        modal.classList.add("show");
    };
});

/* -------- ADD-ONS QUANTITY -------- */
document.querySelectorAll(".addon").forEach(addon => {
    const btns = addon.querySelectorAll("button");
    const count = addon.querySelector(".count");

    btns[1].onclick = () => { 
        count.textContent = Number(count.textContent) + 1; 
        updateTotal(); 
    };
    btns[0].onclick = () => { 
        if (Number(count.textContent) > 0) { 
            count.textContent = Number(count.textContent) - 1; 
            updateTotal(); 
        } 
    };
});

/* -------- UPDATE TOTAL PRICE -------- */
function updateTotal() {
    let addons = 0;
    document.querySelectorAll(".addon").forEach(a => {
        addons += Number(a.dataset.price) * Number(a.querySelector(".count").textContent);
    });
    totalPrice.textContent = basePrice + addons;
}

/* -------- CLOSE MODAL -------- */
document.querySelector(".close").onclick = () => modal.classList.remove("show");
modal.onclick = e => { if (e.target === modal) modal.classList.remove("show"); };

/* -------- SHOW MORE / SHOW LESS -------- */
document.querySelectorAll(".menu-section").forEach(section => {
    const grid = section.querySelector(".menu-grid");
    const btn = section.querySelector(".toggle-btn");

    if (grid.children.length <= 3) {
        btn.style.display = "none";
        return;
    }

    grid.classList.add("collapsed");

    btn.onclick = () => {
        grid.classList.toggle("collapsed");
        btn.textContent = grid.classList.contains("collapsed")
            ? "Show More"
            : "Show Less";
    };
});

/* -------- ADD TO CART -------- */
document.querySelector(".add-cart").onclick = () => {
    const addons = [];
    document.querySelectorAll(".addon").forEach(a => {
        const qty = Number(a.querySelector(".count").textContent);
        if (qty > 0) {
            addons.push({
                name: a.querySelector("span").textContent,
                qty: qty,
                price: Number(a.dataset.price)
            });
        }
    });

    const item = {
        name: modalName.textContent,
        basePrice: basePrice,
        addons: addons,
        total: Number(totalPrice.textContent),
        img: modalImg.src
    };

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart));

    updateCartCount();
    modal.classList.remove("show");
};
