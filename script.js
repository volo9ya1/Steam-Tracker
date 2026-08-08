const searchBtn = document.getElementById('searchBtn');
const appIdInput = document.getElementById('appIdInput');
const resultDiv = document.getElementById('result');
const quickButtons = document.querySelectorAll('.quick-btn');

// Список регионов для проверки
const REGIONS = [
    { code: 'uz', name: 'Узбекистан (UZ)' },
    { code: 'us', name: 'США (US)' },
    { code: 'kz', name: 'Казахстан (KZ)' },
    { code: 'tr', name: 'Турция (TR)' },
    { code: 'ua', name: 'Украина (UA)' },
    { code: 'ar', name: 'Аргентина (AR)' }
];

// Обработка кликов по быстрым кнопкам игр
quickButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        appIdInput.value = btn.getAttribute('data-appid');
        fetchPrices(appIdInput.value.trim());
    });
});

searchBtn.addEventListener('click', () => {
    const appId = appIdInput.value.trim();
    if (!appId) {
        resultDiv.innerHTML = '<p class="error-msg">Пожалуйста, введите AppID игры!</p>';
        return;
    }
    fetchPrices(appId);
});

async function fetchPrices(appId) {
    resultDiv.innerHTML = '<p class="placeholder-text">Загружаем актуальные цены из Steam...</p>';
    let htmlContent = '';

    for (const reg of REGIONS) {
        const url = `https://corsproxy.io/?https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${reg.code}&filters=price_overview`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data && data[appId] && data[appId].success) {
                const priceData = data[appId].data.price_overview;
                const storeUrl = `https://store.steampowered.com/app/${appId}/?cc=${reg.code}`;

                if (priceData) {
                    const finalPrice = (priceData.final / 100).toFixed(2);
                    const currency = priceData.currency;
                    const discount = priceData.discount_percent;

                    let discountHtml = discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : '';

                    htmlContent += `
                        <div class="region-card">
                            <div class="region-info">
                                <span class="region-title">${reg.name}</span>
                                <span class="price">${finalPrice} ${currency} ${discountHtml}</span>
                            </div>
                            <a href="${storeUrl}" target="_blank" class="buy-btn">Купить</a>
                        </div>
                    `;
                } else {
                    htmlContent += `
                        <div class="region-card">
                            <div class="region-info">
                                <span class="region-title">${reg.name}</span>
                                <span class="price">Бесплатно или нет данных</span>
                            </div>
                            <a href="${storeUrl}" target="_blank" class="buy-btn">В Steam</a>
                        </div>
                    `;
                }
            } else {
                htmlContent += `
                    <div class="region-card">
                        <div class="region-info">
                            <span class="region-title">${reg.name}</span>
                            <span class="price" style="color: #ff6b6b;">Игра недоступна в регионе</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            htmlContent += `
                <div class="region-card">
                    <div class="region-info">
                        <span class="region-title">${reg.name}</span>
                        <span class="price" style="color: #ff6b6b;">Ошибка соединения</span>
                    </div>
                </div>
            `;
        }
    }

    resultDiv.innerHTML = htmlContent;
}
