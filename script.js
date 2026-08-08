// Логика переключения экранов (как в приложении погоды)
const navButtons = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

navButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Убираем активный класс у всех кнопок и экранов
        navButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        // Активируем нажатую кнопку
        button.classList.add('active');

        // Находим и показываем целевой экран
        const targetId = button.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Логика работы со Steam API
const gamesContainer = document.getElementById('gamesContainer');
const regionSelect = document.getElementById('regionSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Список популярных игр для автоматического отображения на главной
const POPULAR_GAMES = [
    { id: 1091500, name: "Cyberpunk 2077" },
    { id: 1245620, name: "Elden Ring" },
    { id: 1086940, name: "Baldur's Gate 3" },
    { id: 730, name: "Counter-Strike 2" }
];

// Запуск при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    loadFeaturedGames();
});

// Смена региона обновляет цены
regionSelect.addEventListener('change', () => {
    loadFeaturedGames();
});

// Поиск по кнопке или Enter
searchBtn.addEventListener('click', executeSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});

async function loadFeaturedGames() {
    gamesContainer.innerHTML = '<p class="status-text">Загрузка актуальных цен...</p>';
    const region = regionSelect.value;
    let htmlContent = '';

    for (const game of POPULAR_GAMES) {
        const url = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${game.id}&cc=${region}&filters=price_overview`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[game.id] && data[game.id].success) {
                const priceData = data[game.id].data.price_overview;
                const headerImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.id}/header.jpg`;
                const storeUrl = `https://store.steampowered.com/app/${game.id}/?cc=${region}`;

                let priceHtml = 'Цена не найдена';
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

                htmlContent += `
                    <div class="game-card">
                        ${discountBadge}
                        <img src="${headerImage}" alt="${game.name}" class="game-banner" onerror="this.style.display='none'">
                        <div class="game-info">
                            <div class="game-title">${game.name}</div>
                            <div class="game-details-row">
                                <div class="final-price">${priceHtml}</div>
                                <a href="${storeUrl}" target="_blank" class="open-steam-btn">В Steam ↗</a>
                            </div>
                        </div>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Ошибка:', err);
        }
    }

    gamesContainer.innerHTML = htmlContent || '<p class="status-text">Не удалось загрузить игры.</p>';
}

async function executeSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    gamesContainer.innerHTML = '<p class="status-text">Поиск игры...</p>';
    const region = regionSelect.value;
    const url = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${query}&cc=${region}&filters=price_overview,basic`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data[query] && data[query].success) {
            const gameData = data[query].data;
            const priceData = gameData.price_overview;
            const name = gameData.name || `Игра #${query}`;
            const headerImage = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${query}/header.jpg`;
            const storeUrl = `https://store.steampowered.com/app/${query}/?cc=${region}`;

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
            gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Игра не найдена.</p>';
        }
    } catch (error) {
        gamesContainer.innerHTML = '<p class="status-text" style="color: #ff6b6b;">Ошибка соединения.</p>';
    }
}
