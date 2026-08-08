/* =========================================
   STEAM SALE TRACKER - SCRIPT LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Интерактив для фильтров-пилюль (переключение активного класса)
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
    });

    // 2. Кнопка "Сердечко" (Избранное) на карточке игры
    const favoriteBtn = document.querySelector('.favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Чтобы клик не уходил на саму карточку
            const icon = favoriteBtn.querySelector('i');
            
            if (icon.classList.contains('fa-regular')) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#ff4757'; // Красный цвет при добавлении в избранное
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = '#fff';
            }
        });
    }

    // 3. Кнопка очистки крестика в поисковой строке
    const clearIcon = document.querySelector('.clear-icon');
    const searchInput = document.querySelector('.search-bar input');
    
    if (clearIcon && searchInput) {
        clearIcon.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.focus();
        });
    }

    // 4. Переключатели вида (Список / Сетка)
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // 5. Кнопка подтверждения статуса (зеленая галочка)
    const checkBtn = document.querySelector('.check-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', () => {
            checkBtn.style.background = 'rgba(144, 193, 91, 0.2)';
            setTimeout(() => {
                checkBtn.style.background = 'transparent';
            }, 300);
        });
    }

});
