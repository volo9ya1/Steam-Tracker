const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const gamesContainer = document.getElementById('gamesContainer');
const regionSelect = document.getElementById('regionSelect');

// Переключение вкладок внизу
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabContents.forEach(tab => tab.classList.remove('active'));

        item.classList.add('active');
        const tabId = 'tab-' + item.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Поиск по клику или Enter
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) fetchGameData(query);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) fetchGameData(query);
    }
});

async function fetchGameData(appId) {
    gamesContainer.innerHTML = '<p class="loading-text">Загрузка данных из Steam...</p>';
    const region = regionSelect.value;
    
    // Запрос через CORS-прокси к Steam API
    const url = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${region}&filters=price_overview,basic`;

    try {
        const response = await fetch(url);
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
                            <div class="price-box">
                                <div class="final-price">${priceHtml}</div>
                            </div>
                            <a href="${storeUrl}" target="_blank" class="open-steam-btn">Открыть в Steam ↗</a>
                        </div>
                    </div>
                </div>
            `;
        } else {
            gamesContainer.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Игра с таким AppID не найдена.</p>';
        }
    } catch (error) {
        gamesContainer.innerHTML = '<p class="loading-text" style="color: #ff6b6b;">Ошибка соединения с сервером.</p>';
    }
}
