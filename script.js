// Переключение экранов (приложение погоды стиль)
const navButtons = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        navButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        button.classList.add('active');
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

const gamesContainer = document.getElementById('gamesContainer');
const regionSelect = document.getElementById('regionSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Запуск при загрузке страницы — подтягиваем скидки автоматически
window.addEventListener('DOMContentLoaded', () => {
    loadFeaturedSales();
});

regionSelect.addEventListener('change', () => {
    loadFeaturedSales();
});

searchBtn.addEventListener('click', executeSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

// 1. Автоматическая загрузка актуальных скидок от Steam
async function loadFeaturedSales() {
    gamesContainer.innerHTML = '<p class="status-text">Загружаем крупные скидки...</p>';
    const region = regionSelect.value;
    
    try {
        const url = `https://corsproxy.io/?https://store.steampowered.com/api/featuredcategories/?cc=${region}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.specials && data.specials.items) {
            let htmlContent = '';
            // Берем первые 10 игр со скидками
            const items = data.specials.items.slice(0, 10);

            for (const item of items) {
                const appId = item.id;
                const name = item.name;
                const headerImage = item.header_image;
                const storeUrl = `https://store.steampowered.com/app/${appId}/?cc=${region}`;

                const finalPrice = (item.final_price / 100).toFixed(2);
                const currency = item.currency || '';
                const discount = item.discount_percent;

                let discountBadge = '';
                if (discount > 0) {
                    discountBadge = `<div class="discount-badge">-${discount}%</div>`;
                }

                htmlContent += `
                    <div class="game-card">
                        ${discountBadge}
                        <img src="${headerImage}" alt="${name}" class="game-banner" onerror="this.style.display='none'">
                        <div class="game-info">
                            <div class="game-title">${name}</div>
                            <div class="game-details-row">
                                <div class="final-price">${finalPrice} ${currency}</div>
                                <a href="${storeUrl}" target="_blank" class="open-steam-btn">В Steam ↗</a>
                            </div>
                        </div>
                    </div>
                `;
            }
            gamesContainer.innerHTML = htmlContent || '<p class="status-text">Нет доступных скидок.</p>';
        } else {
            gamesContainer.innerHTML = '<p class="status-text">Не удалось загрузить ленту скидок.</p>';
        }
    } catch (err) {
        console.error('Ошибка:', err);
        gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Ошибка соединения со Steam.</p>';
    }
}

// 2. Умный поиск по названию или AppID
async function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    gamesContainer.innerHTML = '<p class="status-text">Ищем игру...</p>';
    const region = regionSelect.value;

    try {
        let appId = query;

        // Если ввели текст, а не цифры, ищем AppID через бесплатный поиск Steam Store
        if (isNaN(query)) {
            const searchUrl = `https://corsproxy.io/?https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=russian&cc=${region}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData && searchData.items && searchData.items.length > 0) {
                appId = searchData.items[0].id; // Берем первую найденную игру
            } else {
                gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Игра по такому названию не найдена.</p>';
                return;
            }
        }

        // Запрашиваем детальную информацию и цену для найденного AppID
        const detailsUrl = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${region}&filters=price_overview,basic`;
        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data && data[appId] && data[appId].success) {
            const gameData = data[appId].data;
            const priceData = gameData.price_overview;
            const name = gameData.name || `Игра #${appId}`;
            const headerImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
            const storeUrl = `https://store.steampowered.com/app/${appId}/?cc=${region}`;

            let priceHtml = 'Бесплатно / Нет цены';
            let discountBadge = '';

            if (priceData) {
                const finalPrice = (priceData.final / 100).toFixed(2);
                const currency = priceData.currency;
                const discount = priceData.discount_percent;

                if (discount > 0) {
                    discountBadge = `<div class="discount-badge">-${discount}%</div>`;
                }
                priceHtml = `${finalPrice} ${currency}`;
            }

            gamesContainer.innerHTML = `
                <div class="game-card">
                    ${discountBadge}
                    <img src="${headerImage}" alt="${name}" class="game-banner" onerror="this.style.display='none'">
                    <div class="game-info">
                        <div class="game-title">${name}</div>
                        <div class="game-details-row">
                            <div class="final-price">${priceHtml}</div>
                            <a href="${storeUrl}" target="_blank" class="open-steam-btn">В Steam ↗</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Не удалось получить данные об игре.</p>';
        }
    } catch (error) {
        console.error(error);
        gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Ошибка запроса.</p>';
    }
}
