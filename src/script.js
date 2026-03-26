const API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const wallpaperImg = document.getElementById('wallpaper');
const timeEl = document.getElementById('time');
const infoEl = document.getElementById('info');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtn');

let currentArtwork = null;

// Update time every second
function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Display artwork info
function displayInfo(artwork) {
    const title = artwork.title || 'Untitled';
    const artist = artwork.artistDisplayName || artwork.culture || 'Unknown';
    const date = artwork.objectDate || '';

    infoEl.innerHTML = `
        <div class="info-title">${title}</div>
        <div class="info-artist">${artist}</div>
        ${date ? `<div class="info-artist">${date}</div>` : ''}
    `;
}

// Load and display wallpaper
async function loadWallpaper(imageUrl, artwork) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            wallpaperImg.src = imageUrl;
            wallpaperImg.classList.add('loaded');
            currentArtwork = artwork;
            displayInfo(artwork);
            resolve();
        };
        img.onerror = () => {
            console.error('Failed to load image');
            resolve();
        };
        img.src = imageUrl;
    });
}

// Fetch object details
async function fetchObjectDetails(objectId) {
    try {
        const response = await fetch(`${API_BASE}/objects/${objectId}`);
        const artwork = await response.json();

        if (artwork.isPublicDomain && artwork.primaryImage) {
            return artwork;
        }
        return null;
    } catch (error) {
        console.error('Error fetching object:', error);
        return null;
    }
}

// Get random artwork
async function getRandomArtwork() {
    randomBtn.classList.add('loading');
    
    try {
        // Get list of all objects
        const response = await fetch(`${API_BASE}/objects?hasImages=true`);
        const data = await response.json();

        // Pick random object ID
        const randomIndex = Math.floor(Math.random() * Math.min(data.total, 10000));
        const randomId = data.objectIDs[randomIndex];

        // Fetch object details
        const artwork = await fetchObjectDetails(randomId);
        
        if (artwork) {
            await loadWallpaper(artwork.primaryImage, artwork);
        } else {
            // Retry if image not available
            await getRandomArtwork();
        }
    } catch (error) {
        console.error('Error getting random artwork:', error);
    } finally {
        randomBtn.classList.remove('loading');
    }
}

// Search for artwork
async function searchArtwork(query) {
    if (!query.trim()) return;

    randomBtn.classList.add('loading');
    
    try {
        const params = new URLSearchParams({
            q: query,
            hasImages: 'true',
            isPublicDomain: 'true'
        });

        const response = await fetch(`${API_BASE}/search?${params}`);
        const data = await response.json();

        if (data.objectIDs.length === 0) {
            infoEl.innerHTML = '<div class="info-title">No results found</div>';
            randomBtn.classList.remove('loading');
            return;
        }

        // Pick random result from search
        const randomIndex = Math.floor(Math.random() * Math.min(data.objectIDs.length, 100));
        const objectId = data.objectIDs[randomIndex];

        // Fetch object details
        const artwork = await fetchObjectDetails(objectId);
        
        if (artwork) {
            await loadWallpaper(artwork.primaryImage, artwork);
        } else {
            infoEl.innerHTML = '<div class="info-title">Image not available</div>';
        }
    } catch (error) {
        console.error('Error searching artwork:', error);
        infoEl.innerHTML = '<div class="info-title">Search error</div>';
    } finally {
        randomBtn.classList.remove('loading');
    }
}

// Event listeners
randomBtn.addEventListener('click', getRandomArtwork);

searchBtn.addEventListener('click', () => {
    const query = searchInput.value;
    if (query.trim()) {
        searchArtwork(query);
        searchInput.value = '';
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value;
        if (query.trim()) {
            searchArtwork(query);
            searchInput.value = '';
        }
    }
});

// Initialize
updateTime();
setInterval(updateTime, 1000);
getRandomArtwork();
