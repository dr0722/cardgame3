// Pixabay API Key and URL
const PIXABAY_API_KEY = '4952456-dd174a28a5c64ce95c67742b6';
const PIXABAY_API_URL = 'https://pixabay.com/api/';

// Game state
let words = [];
let currentWordIndex = 0;
let score = 0;
let imageOptions = [];
let correctImageIndex = null;
let isGameActive = false;

// DOM Elements
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const wordInput = document.getElementById('word-input');
const startButton = document.getElementById('start-button');
const currentWordElement = document.getElementById('current-word');
const currentScoreElement = document.getElementById('current-score');
const wordProgressElement = document.getElementById('word-progress');
const imageContainer = document.getElementById('image-container');
const feedbackElement = document.getElementById('feedback');
const finalScoreElement = document.getElementById('final-score-text');
const restartButton = document.getElementById('restart-button');
const newWordsButton = document.getElementById('new-words-button');
const soundButton = document.getElementById('sound-button');
const wordSound = document.getElementById('word-sound');
const successSound = document.getElementById('success-sound');
const errorSound = document.getElementById('error-sound');
const completeSound = document.getElementById('complete-sound');

// Event Listeners
startButton.addEventListener('click', startGame);
soundButton.addEventListener('click', playCurrentWordSound);
restartButton.addEventListener('click', restartGame);
newWordsButton.addEventListener('click', goToSetupScreen);

// Functions
async function startGame() {
    const inputText = wordInput.value.trim();
    if (!inputText) {
        alert('請輸入至少一個單字！');
        return;
    }

    // Parse words from input
    words = inputText.split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);

    if (words.length === 0) {
        alert('請輸入至少一個有效的單字！');
        return;
    }

    // Reset game state
    currentWordIndex = 0;
    score = 0;
    isGameActive = true;

    // Update UI
    updateScoreDisplay();
    updateWordProgressDisplay();

    // Switch to game screen
    showScreen(gameScreen);

    // Start the first round
    await loadNextWord();
}

async function loadNextWord() {
    if (currentWordIndex >= words.length) {
        endGame();
        return;
    }

    const currentWord = words[currentWordIndex];
    currentWordElement.textContent = currentWord;
    updateWordProgressDisplay();

    // Fetch images for this word
    try {
        await fetchImagesForWord(currentWord);
        renderImageOptions();
    } catch (error) {
        console.error('Failed to fetch images:', error);
        alert('無法載入圖片，請檢查您的網絡連接或重試。');
    }
}

async function fetchImagesForWord(word) {
    // We'll need images for the current word (correct answer)
    // and some random other words (incorrect answers)
    try {
        // Get images for the correct answer
        const correctImages = await fetchImagesFromPixabay(word);
        
        if (correctImages.length === 0) {
            throw new Error(`No images found for: ${word}`);
        }
        
        // Shuffle and take up to 4 images as options
        const shuffledCorrectImages = shuffleArray(correctImages);
        const correctImage = shuffledCorrectImages[0];
        
        // Create distractors - get images for different words
        const otherWords = getRandomWordsExcept(word);
        const distractorImages = [];
        
        for (const otherWord of otherWords) {
            if (distractorImages.length >= 3) break;
            
            const images = await fetchImagesFromPixabay(otherWord);
            if (images.length > 0) {
                distractorImages.push(images[0]);
            }
        }

        // If we don't have enough distractor images, try generic searches
        if (distractorImages.length < 3) {
            const genericSearchTerms = ['object', 'animal', 'food', 'place'];
            for (const term of genericSearchTerms) {
                if (distractorImages.length >= 3) break;
                
                const images = await fetchImagesFromPixabay(term);
                if (images.length > 0) {
                    distractorImages.push(images[0]);
                }
            }
        }
        
        // Compile all image options
        imageOptions = [correctImage, ...distractorImages.slice(0, 3)];
        imageOptions = shuffleArray(imageOptions);
        
        // Find index of correct image
        correctImageIndex = imageOptions.findIndex(img => img.id === correctImage.id);
        
        return imageOptions;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
}

async function fetchImagesFromPixabay(query) {
    const url = `${PIXABAY_API_URL}?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=10&safesearch=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.hits && data.hits.length > 0) {
            return data.hits.map(hit => ({
                id: hit.id,
                url: hit.webformatURL,
                word: query
            }));
        }
        return [];
    } catch (error) {
        console.error('Pixabay API error:', error);
        return [];
    }
}

function renderImageOptions() {
    // Clear previous images
    imageContainer.innerHTML = '';
    
    // Create and append image cards
    imageOptions.forEach((image, index) => {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = image.url;
        img.alt = 'Image option';
        card.appendChild(img);
        
        // Add click event
        card.addEventListener('click', () => handleImageClick(index));
        
        imageContainer.appendChild(card);
    });
}

function handleImageClick(index) {
    if (!isGameActive) return;
    
    const isCorrect = index === correctImageIndex;
    
    if (isCorrect) {
        score += 10;
        updateScoreDisplay();
        showFeedback('正確!', 'success');
        playSound(successSound);
    } else {
        showFeedback('再試一次!', 'error');
        playSound(errorSound);
        return; // Don't advance to next word if incorrect
    }
    
    // Move to next word after a delay
    setTimeout(async () => {
        currentWordIndex++;
        await loadNextWord();
    }, 1500);
}

function showFeedback(message, type) {
    feedbackElement.className = `feedback ${type}`;
    feedbackElement.querySelector('.feedback-content').textContent = message;
    feedbackElement.style.display = 'block';
    
    // Hide feedback after a delay
    setTimeout(() => {
        feedbackElement.style.display = 'none';
    }, 1500);
}

function updateScoreDisplay() {
    currentScoreElement.textContent = score;
}

function updateWordProgressDisplay() {
    wordProgressElement.textContent = `${currentWordIndex + 1}/${words.length}`;
}

function endGame() {
    isGameActive = false;
    
    // Play completion sound
    playSound(completeSound);
    
    // Update result screen
    finalScoreElement.textContent = `太棒了! ${score} 分!`;
    
    // Show result screen
    showScreen(resultScreen);
}

function restartGame() {
    currentWordIndex = 0;
    score = 0;
    isGameActive = true;
    
    // Update UI
    updateScoreDisplay();
    updateWordProgressDisplay();
    
    // Switch back to game screen
    showScreen(gameScreen);
    
    // Load the first word
    loadNextWord();
}

function goToSetupScreen() {
    showScreen(setupScreen);
}

function showScreen(screen) {
    setupScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    resultScreen.classList.remove('active');
    
    screen.classList.add('active');
}

function playCurrentWordSound() {
    const word = words[currentWordIndex];
    if (!word) return;
    
    // Use the free Text-to-Speech API
    const ttsUrl = `https://api.voicerss.org/?key=66b4580e7a0c4c1da33f396f8c3eb5be&hl=en-us&v=Amy&c=MP3&f=16khz_16bit_stereo&src=${encodeURIComponent(word)}`;
    
    wordSound.src = ttsUrl;
    wordSound.play().catch(error => {
        console.error('Error playing sound:', error);
    });
}

function playSound(audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(error => {
        console.error('Error playing sound:', error);
    });
}

// Helper functions
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getRandomWordsExcept(excludeWord) {
    // If we have enough words in our input, use those
    if (words.length > 4) {
        return words.filter(w => w !== excludeWord);
    }
    
    // Otherwise, use some default words
    const defaultWords = ['tree', 'bird', 'flower', 'sun', 'fish', 'cat', 'dog', 'apple', 'car', 'house'];
    return defaultWords.filter(w => w !== excludeWord);
}

// Initialize the game by showing setup screen
showScreen(setupScreen);