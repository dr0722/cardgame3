// 調試工具 - 可在控制台用於檢查事件綁定
(function() {
    console.log('調試工具已載入');
    
    // 檢查DOM元素是否存在
    function checkElements() {
        const elements = {
            hamburger: document.querySelector('.hamburger'),
            menu: document.querySelector('.menu'),
            cards: document.querySelectorAll('.card'),
            gameSection: document.querySelector('.card-gallery')
        };
        
        console.table({
            'hamburger存在': !!elements.hamburger,
            'menu存在': !!elements.menu,
            'cards數量': elements.cards.length,
            'gameSection存在': !!elements.gameSection
        });
        
        return elements;
    }
    
    // 添加測試事件監聽器
    function addTestListeners(elements) {
        if (elements.hamburger) {
            console.log('添加漢堡選單測試監聽器');
            elements.hamburger.addEventListener('click', function() {
                console.log('調試: 漢堡選單被點擊');
            });
        }
        
        elements.cards.forEach((card, index) => {
            console.log(`添加卡片${index}測試監聽器`);
            card.addEventListener('click', function() {
                console.log(`調試: 卡片${index}被點擊`);
            });
        });
    }
    
    // 等待DOM完全載入
    window.addEventListener('load', function() {
        console.log('頁面完全載入');
        const elements = checkElements();
        addTestListeners(elements);
    });
    
    // 公開調試方法
    window.debugTools = {
        checkElements,
        testAPICall: async function() {
            try {
                console.log('測試API調用...');
                const response = await fetch('/api/images?query=test');
                const data = await response.json();
                console.log('API響應:', data);
                return data;
            } catch (error) {
                console.error('API調用失敗:', error);
                return null;
            }
        }
    };
})();
