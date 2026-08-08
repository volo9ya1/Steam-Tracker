/* ==========================================================================
   STEAM STORE - MASTER JAVASCRIPT LOGIC
   ========================================================================== */

// --- 1. Глобальное состояние приложения (State) ---
const AppState = {
    cart: JSON.parse(localStorage.getItem('steam_super_cart')) || [],
    currency: 'UZ',
    proxyUrl: 'https://api.allorigins.win/get?url=',
    endpoints: {
        featured: 'https://store.steampowered.com/api/featuredcategories/?cc=uz',
        search: 'https://store.steampowered.com/api/storesearch/?term='
    }
};

// --- 2. Управление DOM-элементами ---
const DOM = {
    // Вкладки
    tabTriggers: document.querySelectorAll('.tab-trigger'),
    tabBodies: document.querySelectorAll('.tab-body'),
    
    // Контейнеры для рендера
    carousel: document.getElementById('featuredCarousel'),
    offersGrid: document.getElementById('specialOffersGrid'),
    lists: {
        new: document.getElementById('newListContainer'),
        top: document.getElementById('topListContainer'),
        upcoming: document.getElementById('upcomingListContainer'),
        discounts: document.getElementById('discountsListContainer')
    },
    
    // Корзина
    cartBtn: document.getElementById('floatingCartBtn'),
    cartCount: document.getElementById('floatingCartCount'),
    cartModal: document.getElementById('cartModal'),
    cartItems: document.getElementById('cartItemsContainer'),
    cartTotal: document.getElementById('cartTotalPrice'),
    
    // Авторизация
    loginBtn: document.getElementById('loginBtn'),
    loginModal: document.getElementById('loginModal'),
    loginForm: document.getElementById('loginForm'),
    
    // Общие модалки
    closeButtons: document.querySelectorAll('.close-modal'),
    
    // Поиск
    searchInput: document.getElementById('globalSearch'),
    searchSubmit: document.getElementById('submitSearch')
};

// --- 3. Базовые утилиты и API ---

/**
 * Универсальная функция для запросов к Steam API через прокси
 */
async function fetchAPI(targetUrl) {
    try {
        const response = await fetch(AppState.proxyUrl + encodeURIComponent(targetUrl));
        if (!response.ok) throw new Error('Сетевая ошибка');
        const data = await response.json();
        return JSON.parse(data.contents);
    } catch (error) {
        console.error("Ошибка API:", error);
        return null;
    }
}

/**
 * Форматирование цены
 */
function formatPrice(rawPrice) {
    if (!rawPrice || rawPrice === 0) return 'Бесплатно';
    return (rawPrice / 100).toFixed(2) + ' ' + AppState.currency;
}

// --- 4. Рендеринг интерфейса ---

/**
 * Рендер главной карусели (Избранное)
 */
async function loadFeaturedCarousel() {
    if (!DOM.carousel) return;
    
    const data = await fetchAPI(AppState.endpoints.featured);
    DOM.carousel.innerHTML = ''; // Очистка скелетонов
    
    if (!data || !data.specials) {
        DOM.carousel.innerHTML = '<p style="color:white; padding: 20px;">Не удалось загрузить данные.</p>';
        return;
    }

    const items = data.specials.items.slice(0, 1); // Берем одну главную для большого блока
    
    items.forEach(game => {
        const priceText = formatPrice(game.final_price);
        const html = `
            <div class="carousel-item" style="display:flex; background: #000; border-radius: 4px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
                <img src="${game.header_image}" style="width: 60%; object-fit: cover;" alt="${game.name}">
                <div style="padding: 20px; display:flex; flex-direction: column; justify-content: space-between; width: 40%; background: linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(27,40,56,1) 100%);">
                    <div>
                        <h3 style="font-size: 24px; margin-bottom: 15px;">${game.name}</h3>
                        <div style="display:flex; flex-wrap: wrap; gap: 5px; margin-bottom: 15px;">
                            <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 2px; font-size: 11px;">Экшен</span>
                            <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 2px; font-size: 11px;">Шедевр</span>
                        </div>
                    </div>
                    <div style="display:flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 16px; color: #a4d007;">${priceText}</span>
                        <button onclick="CartSystem.add('${game.id}', '${game.name.replace(/'/g, "")}', ${game.final_price || 0}, '${game.header_image}')" style="background: #66c0f4; border:none; padding: 8px 15px; cursor: pointer; border-radius: 2px; color: #000; font-weight: bold;">В корзину</button>
                    </div>
                </div>
            </div>
        `;
        DOM.carousel.innerHTML += html;
    });
}

/**
 * Рендер сетки специальных предложений
 */
async function loadSpecialOffers() {
    if (!DOM.offersGrid) return;

    const data = await fetchAPI(AppState.endpoints.featured);
    DOM.offersGrid.innerHTML = ''; 
    
    if (!data || !data.specials) return;

    const items = data.specials.items.slice(1, 5); // Следующие 4 игры
    
    items.forEach(game => {
        const discountBadge = game.discount_percent > 0 
            ? `<div style="position: absolute; top:0; right:0; background: #a4d007; color: black; padding: 5px 10px; font-weight: bold; font-size: 20px;">-${game.discount_percent}%</div>` 
            : '';
            
        const html = `
            <div style="background: #202d39; position: relative; border-radius: 4px; overflow: hidden; transition: 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                ${discountBadge}
                <img src="${game.header_image}" style="width: 100%; display: block;" alt="${game.name}">
                <div style="padding: 10px;">
                    <div style="color: white; font-size: 14px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #a4d007; font-size: 12px;">${formatPrice(game.final_price)}</span>
                        <button onclick="CartSystem.add('${game.id}', '${game.name.replace(/'/g, "")}', ${game.final_price || 0}, '${game.header_image}')" style="background: rgba(102, 192, 244, 0.2); color: #66c0f4; border:none; padding: 4px 8px; border-radius:2px; cursor: pointer; font-size: 11px;">Добавить</button>
                    </div>
                </div>
            </div>
        `;
        DOM.offersGrid.innerHTML += html;
    });
}

/**
 * Рендер списков (для вкладок Новинки, Лидеры продаж и т.д.)
 */
async function loadTabList(listType, container) {
    if (!container) return;
    container.innerHTML = '<p class="loading-text">Загрузка...</p>';
    
    // Для демо используем разные срезы из одного запроса, так как публичное API Steam ограничено
    const data = await fetchAPI(AppState.endpoints.featured);
    container.innerHTML = '';

    if (!data || !data.top_sellers) return;

    let items = [];
    if (listType === 'new') items = data.new_releases.items.slice(0, 10);
    if (listType === 'top') items = data.top_sellers.items.slice(0, 10);
    if (listType === 'upcoming') items = data.coming_soon.items.slice(0, 10);
    if (listType === 'discounts') items = data.specials.items.slice(0, 10);

    items.forEach(game => {
        const html = `
            <div style="display: flex; background: rgba(0,0,0,0.2); margin-bottom: 5px; transition: 0.2s; cursor: pointer;" onmouseover="this.style.background='rgba(102, 192, 244, 0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
                <img src="${game.header_image}" style="width: 120px; height: 56px; object-fit: cover;" alt="">
                <div style="padding: 5px 15px; display: flex; flex-direction: column; justify-content: center; flex: 1;">
                    <div style="color: white; font-size: 14px;">${game.name}</div>
                    <div style="font-size: 11px; color: #4c6c8c;">Windows, Mac OS</div>
                </div>
                <div style="padding: 10px; display: flex; align-items: center; gap: 15px;">
                    <span style="color: white; font-size: 13px;">${formatPrice(game.final_price)}</span>
                    <button onclick="CartSystem.add('${game.id}', '${game.name.replace(/'/g, "")}', ${game.final_price || 0}, '${game.header_image}')" style="background: #2a475e; color: #fff; border: 1px solid #66c0f4; padding: 4px 10px; border-radius: 2px; cursor: pointer;">+</button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// --- 5. Модуль Корзины ---
const CartSystem = {
    init() {
        this.updateUI();
    },

    add(id, name, price, img) {
        // Проверка на дубликаты
        if (AppState.cart.find(item => item.id === id)) {
            alert('Игра уже в корзине!');
            return;
        }

        AppState.cart.push({ id, name, price, img });
        this.save();
        this.updateUI();
        
        // Визуальный эффект
        DOM.cartBtn.style.transform = 'scale(1.2)';
        setTimeout(() => DOM.cartBtn.style.transform = 'scale(1)', 200);
    },

    remove(id) {
        AppState.cart = AppState.cart.filter(item => item.id !== id);
        this.save();
        this.updateUI();
        this.renderModal();
    },

    save() {
        localStorage.setItem('steam_super_cart', JSON.stringify(AppState.cart));
    },

    updateUI() {
        if (DOM.cartCount) {
            DOM.cartCount.textContent = AppState.cart.length;
        }
    },

    renderModal() {
        if (!DOM.cartItems || !DOM.cartTotal) return;

        if (AppState.cart.length === 0) {
            DOM.cartItems.innerHTML = '<p style="text-align:center; padding: 30px; color: #8f98a0;">Ваша корзина пуста.</p>';
            DOM.cartTotal.textContent = `0.00 ${AppState.currency}`;
            return;
        }

        DOM.cartItems.innerHTML = '';
        let total = 0;

        AppState.cart.forEach(item => {
            total += item.price;
            DOM.cartItems.innerHTML += `
                <div style="display: flex; background: #1b2838; margin-bottom: 10px; padding: 10px; border-radius: 3px;">
                    <img src="${item.img}" style="width: 120px; height: 56px; object-fit: cover; margin-right: 15px;" alt="">
                    <div style="flex: 1;">
                        <h4 style="color: white; font-size: 14px; margin: 0 0 5px 0;">${item.name}</h4>
                        <button onclick="CartSystem.remove('${item.id}')" style="background: transparent; border: none; color: #66c0f4; font-size: 11px; text-decoration: underline; cursor: pointer;">Удалить</button>
                    </div>
                    <div style="color: #a4d007; font-size: 14px; font-weight: bold;">
                        ${formatPrice(item.price)}
                    </div>
                </div>
            `;
        });

        DOM.cartTotal.textContent = formatPrice(total);
    }
};

// --- 6. Управление событиями (Event Listeners) ---

function setupEventListeners() {
    // Переключение вкладок (Tabs)
    DOM.tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            // Убираем активный класс у всех
            DOM.tabTriggers.forEach(t => t.classList.remove('active'));
            DOM.tabBodies.forEach(b => b.classList.remove('active'));
            
            // Добавляем активный класс текущему
            trigger.classList.add('active');
            const targetId = trigger.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');

            // Подгружаем данные, если контейнер пуст
            const container = document.getElementById(targetId).querySelector('.list-view-container');
            if (container && container.innerHTML.trim() === '') {
                const type = targetId.split('-')[1]; // tab-new -> new
                loadTabList(type, container);
            }
        });
    });

    // Модалка корзины
    if (DOM.cartBtn) {
        DOM.cartBtn.addEventListener('click', () => {
            CartSystem.renderModal();
            DOM.cartModal.style.display = 'flex';
        });
    }

    // Модалка авторизации
    if (DOM.loginBtn) {
        DOM.loginBtn.addEventListener('click', () => {
            DOM.loginModal.style.display = 'flex';
        });
    }

    // Обработка формы входа
    if (DOM.loginForm) {
        DOM.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Авторизация в демо-режиме успешна!');
            DOM.loginModal.style.display = 'none';
            DOM.loginBtn.textContent = 'Профиль';
        });
    }

    // Закрытие всех модалок
    DOM.closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    // Закрытие по клику вне окна
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.style.display = 'none';
        }
    });
}

// --- 7. Инициализация при запуске ---
window.addEventListener('DOMContentLoaded', () => {
    // Инициализация корзины
    CartSystem.init();
    
    // Настройка событий
    setupEventListeners();
    
    // Первичная загрузка данных
    loadFeaturedCarousel();
    loadSpecialOffers();
    
    // Загрузка первой активной вкладки
    loadTabList('new', DOM.lists.new);
});
