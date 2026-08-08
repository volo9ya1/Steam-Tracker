/* ==========================================================================
   STEAM CYBERPUNK - SCRIPT LOGIC (ALL DISCOUNTS)
   ========================================================================== */

const AppState = {
    cart: JSON.parse(localStorage.getItem('cyber_steam_cart')) || [],
    proxyUrl: 'https://api.allorigins.win/get?url=',
    featuredUrl: 'https://store.steampowered.com/api/featuredcategories/?cc=uz'
};

async function fetchAPI(url) {
    try {
        const res = await fetch(AppState.proxyUrl + encodeURIComponent(url));
        const data = await res.json();
        return JSON.parse(data.contents);
    } catch (e) {
        console.error("Ошибка загрузки API:", e);
        return null;
    }
}

function formatPrice(raw) {
    if (!raw || raw === 0) return 'Бесплатно';
    return (raw / 100).toFixed(2) + ' UZ';
}

// Загрузка ВСЕХ скидок со спецпредложений Steam на главный экран
async function loadAllSteamDiscounts() {
    const grid = document.getElementById('specialOffersGrid');
    if (!grid) return;

    grid.innerHTML = '<p style="color:var(--neon-orange); grid-column: 1/-1; text-align:center; padding:40px;">Загрузка всех скидок из Steam...</p>';

    const data = await fetchAPI(AppState.featuredUrl);
    
    if (!data || !data.specials || !data.specials.items) {
        grid.innerHTML = '<p style="color:red; grid-column: 1/-1; text-align:center;">Не удалось загрузить скидки.</p>';
        return;
    }

    grid.innerHTML = '';
    
    // Берем абсолютно все игры из блока спецпредложений
    const allSpecials = data.specials.items;

    allSpecials.forEach(game => {
        const discount = game.discount_percent ? `<div class="discount-tag">-${game.discount_percent}%</div>` : '';
        const price = formatPrice(game.final_price);
        const name = game.name.replace(/'/g, "");

        const card = document.createElement('div');
        card.className = 'neon-game-card';
        card.innerHTML = `
            ${discount}
            <img src="${game.header_image}" alt="${name}">
            <div class="card-body">
                <div class="game-title-neon" title="${name}">${name}</div>
                <div class="price-row">
                    <span class="price-neon">${price}</span>
                    <button class="add-to-cart-neon" onclick="Cart.add('${game.id}', '${name}', ${game.final_price || 0}, '${game.header_image}')">В корзину</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Управление корзиной
const Cart = {
    add(id, name, price, img) {
        if (AppState.cart.find(i => i.id === id)) {
            alert('Игра уже в корзине!');
            return;
        }
        AppState.cart.push({ id, name, price, img });
        localStorage.setItem('cyber_steam_cart', JSON.stringify(AppState.cart));
        this.updateCount();
        alert(`Игра "${name}" добавлена в корзину!`);
    },
    
    remove(id) {
        AppState.cart = AppState.cart.filter(i => i.id !== id);
        localStorage.setItem('cyber_steam_cart', JSON.stringify(AppState.cart));
        this.updateCount();
        this.renderModal();
    },

    updateCount() {
        const counter = document.getElementById('floatingCartCount');
        if (counter) counter.textContent = AppState.cart.length;
    },

    renderModal() {
        const container = document.getElementById('cartItemsContainer');
        const totalEl = document.getElementById('cartTotalPrice');
        if (!container || !totalEl) return;

        if (AppState.cart.length === 0) {
            container.innerHTML = '<p style="color:#777; text-align:center;">Корзина пуста</p>';
            totalEl.textContent = '0.00 UZ';
            return;
        }

        container.innerHTML = '';
        let total = 0;

        AppState.cart.forEach(item => {
            total += item.price;
            container.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#141418; margin-bottom:10px; padding:8px; border-radius:4px;">
                    <img src="${item.img}" style="width:80px; height:40px; object-fit:cover;">
                    <div style="flex:1; margin-left:10px;">
                        <div style="color:#fff; font-size:12px;">${item.name}</div>
                        <button onclick="Cart.remove('${item.id}')" style="background:none; border:none; color:var(--neon-orange); cursor:pointer; font-size:10px;">Удалить</button>
                    </div>
                    <div style="color:var(--neon-yellow); font-weight:bold;">${formatPrice(item.price)}</div>
                </div>
            `;
        });
        totalEl.textContent = formatPrice(total);
    }
};

// Настройка интерактивных кнопок (чтобы всё работало)
document.addEventListener('DOMContentLoaded', () => {
    Cart.updateCount();
    loadAllSteamDiscounts();

    // Кнопка открытия корзины
    const cartBtn = document.getElementById('floatingCartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeModal = document.querySelector('.close-modal');

    if (cartBtn && cartModal) {
        cartBtn.addEventListener('click', () => {
            Cart.renderModal();
            cartModal.style.display = 'flex';
        });
    }

    if (closeModal && cartModal) {
        closeModal.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });
});
