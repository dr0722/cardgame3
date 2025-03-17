// 載入環境變數
require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 提供靜態檔案
app.use(express.static(path.join(__dirname)));

// API 代理，保護 Pixabay API 金鑰
app.get('/api/images', async (req, res) => {
    try {
        const query = req.query.query || 'fantasy+cards';
        const apiKey = process.env.PIXABAY_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: '未設定 API 金鑰' });
        }
        
        const response = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&per_page=4`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('API 請求失敗:', error);
        res.status(500).json({ error: '無法取得圖片' });
    }
});

// 提供主頁面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器執行在 http://localhost:${port}`);
});
