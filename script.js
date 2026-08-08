/* ==========================================================================
   STEAM SALE TRACKER - ADVANCED LOGIC (JS)
   ========================================================================== */

let allGamesCache = [];
let favoritesList = JSON.parse(localStorage.getItem('steam_tracker_favorites')) || [];
let currentViewMode = 'grid'; // 'grid' или 'list'

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Управление экранами (Нижняя навигация)
    const navItems = document.querySelectorAll('.bottom-nav .nav-item');
    const screens = document.querySelectorAll('.app-screen');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            const targetId = item.getAttribute('data-target');
            screens.forEach(screen => {
                screen.style.display = (screen.id === targetId) ? 'block' : 'none';
            });

            // Если переключились на избранное — рендерим его отдельно
            if (targetId === 'screen-favorites') {
                renderFavorites();
            }
        });
    });

    // 2. Загрузка данных из Steam API
    loadSteamDiscounts();

    // 3. Поиск по играм
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allGamesCache.filter(game => game.name.toLowerCase().includes(query));
            renderGames(filtered);
        });
    }

    if (clearSearch && searchInput) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            renderGames(allGamesCache);
            searchInput.focus();
        });
    }

    // 4. Фильтры-пилюли
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filterType = pill.getAttribute('data-filter');
            applyFiltersAndSort(filterType);
        });
    });

    // 5. Сортировка
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortAndRenderGames();
        });
    }

    // 6. Переключатели вида (Список / Сетка)
    const viewBtns = document.querySelectorAll('.view-btn');
    const gridEl = document.getElementById('allOffersGrid');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentViewMode = btn.getAttribute('data-view');
            if (gridEl) {
                if (currentViewMode === 'list') {
                    gridEl.style.flexDirection = 'column';
                } else {
                    gridEl.style.display = 'grid';
                    gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
                }
            }
            renderGames(allGamesCache);
        });
    });
});

// Асинхронная загрузка скидок со спецпредложений Steam
async function loadSteamDiscounts() {
    const grid = document.getElementById('allOffersGrid');
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const steamApiUrl = 'https://store.steampowered.com/api/featuredcategories/?cc=kz';

    try {
        const response = await fetch(proxyUrl + encodeURIComponent(steamApiUrl));
        const data = await response.json();
        const parsedData = JSON.parse(data.contents);

        let rawItems = [];
        if (parsedData.specials && parsedData.specials.items) {
            rawItems = rawItems.concat(parsedData.specials.items);
        }

        // Убираем дубликаты
        const uniqueMap = new Map();
        rawItems.forEach(item => uniqueMap.set(item.id, item));
        allGamesCache = Array.from(uniqueMap.values());

        sortAndRenderGames();

    } catch (error) {
        console.error("Ошибка загрузки данных Steam:", error);
        if (grid) {
            grid.innerHTML = '<p style="color:red; text-align:center; grid-column:1/-1;">Не удалось загрузить данные Steam.</p>';
        }
    }
}

// Отрисовка игр в сетку/список
function renderGames(gamesArray) {
    const grid = document.getElementById('allOffersGrid');
    const countEl = document.getElementById('gamesCount');
    
    if (countEl) countEl.textContent = gamesArray.length;
    if (!grid) return;

    grid.innerHTML = '';

    if (gamesArray.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary); text-align:center; grid-column:1/-1; padding:30px;">Игры не найдены</p>';
        return;
    }

    gamesArray.forEach(game => {
        const discountText = game.discount_percent ? `<div class="discount-badge">-${game.discount_percent}%</div>` : '';
        const priceFormatted = game.final_price === 0 ? 'Бесплатно' : (game.final_price / 100).toFixed(2) + ' ₸';
        const cleanName = game.name.replace(/'/g, "");
        const isFav = favoritesList.some(fav => fav.id === game.id);
        const heartClass = isFav ? 'fa-solid' : 'fa-regular';
        const heartColor = isFav ? 'color: var(--neon-orange);' : '';

        const card = document.createElement('div');
        card.className = 'game-card-neon';
        card.innerHTML = `
            ${discountText}
            <img src="${game.header_image}" alt="${cleanName}" loading="lazy">
            <button class="favorite-btn" onclick="toggleFavorite('${game.id}', '${cleanName}', ${game.final_price || 0}, '${game.header_image}', ${game.discount_percent || 0})">
                <i class="${heartClass} fa-heart" style="${heartColor}"></i>
            </button>
            <div class="game-card-body">
                <div class="game-title" title="${cleanName}">${cleanName}</div>
                <div class="game-pricing">
                    <span class="final-price">${priceFormatted}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Управление избранным
function toggleFavorite(id, name, price, img, discount) {
    const index = favoritesList.findIndex(item => item.id === id);
    
    if (index > -1) {
        favoritesList.splice(index, 1);
    } else {
        favoritesList.push({ id, name, price, img, discount_percent: discount });
    }

    localStorage.setItem('steam_tracker_favorites', JSON.stringify(favoritesList));
    
    // Обновляем счётчик в меню навигации
    const badge = document.getElementById('favoritesBadge');
    if (badge) badge.textContent = favoritesList.length;

    // Перерисовываем текущий список
    renderGames(allGamesCache);
}

// Отрисовка экрана избранного
function renderFavorites() {
    const container = document.getElementById('favoritesGrid');
    if (!container) return;

    container.innerHTML = '';

    if (favoritesList.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary); text-align:center; padding:40px;">В избранном пока ничего нет</p>';
        return;
    }

    favoritesList.forEach(game => {
        const priceFormatted = game.price === 0 ? 'Бесплатно' : (game.price / 100).toFixed(2) + ' ₸';
        const discountText = game.discount_percent ? `<div class="discount-badge">-${game.discount_percent}%</div>` : '';

        const card = document.createElement('div');
        card.className = 'game-card-neon';
        card.innerHTML = `
            ${discountText}
            <img src="${game.img}" alt="${game.name}">
            <button class="favorite-btn" onclick="toggleFavorite('${game.id}'); renderFavorites();">
                <i class="fa-solid fa-heart" style="color: var(--neon-orange);"></i>
            </button>
            <div class="game-card-body">
                <div class="game-title">${game.name}</div>
                <div class="game-pricing"><span class="final-price">${priceFormatted}</span></div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Сортировка и фильтрация
function applyFiltersAndSort(filterType) {
    let result = [...allGamesCache];

    if (filterType === '90') {
        result = result.filter(g => g.discount_percent >= 90);
    } else if (filterType === 'free') {
        result = result.filter(g => g.final_price === 0);
    }

    renderGames(result);
}

function sortAndRenderGames() {
    const sortSelect = document.getElementById('sortSelect');
    let sorted = [...allGamesCache];

    if (sortSelect) {
        const val = sortSelect.value;
        if (val === 'discount') {
            sorted.sort((a, b) => (b.discount_percent || 0) - (a.discount_percent || 0));
        } else if (val === 'price_low') {
            sorted.sort((a, b) => (a.final_price || 0) - (b.final_price || 0));
        } else if (val === 'price_high') {
            sorted.sort((a, b) => (b.final_price || 0) - (a.final_price || 0));
        }
    }

    renderGames(sorted);
}
