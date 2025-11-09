/**
 * Asteroid selection page functionality
 */

let currentSortBy = 'name';
let asteroids = [...asteroidDatabase]; // Copy the database

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    renderAsteroids();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', (e) => {
        currentSortBy = e.target.value;
        sortAsteroids(currentSortBy);
        renderAsteroids();
    });
}

// Sort asteroids based on selected criteria
function sortAsteroids(sortBy) {
    asteroids.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'weight') {
            return b.weight - a.weight; // Descending order
        } else if (sortBy === 'diameter') {
            return b.diameter - a.diameter; // Descending order
        } else if (sortBy === 'orbitRadius') {
            return a.orbitRadius - b.orbitRadius; // Ascending order
        } else if (sortBy === 'date') {
            return a.date.localeCompare(b.date);
        }
        return 0;
    });
}

// Render asteroid tiles
function renderAsteroids() {
    const grid = document.getElementById('asteroid-grid');
    grid.innerHTML = '';

    asteroids.forEach(asteroid => {
        const tile = createAsteroidTile(asteroid);
        grid.appendChild(tile);
    });
}

// Create an individual asteroid tile
function createAsteroidTile(asteroid) {
    const tile = document.createElement('div');
    tile.className = 'asteroid-tile';
    tile.onclick = () => selectAsteroid(asteroid);

    const typeClass = asteroid.type.toLowerCase().includes('reference') ? 'reference' : '';

    tile.innerHTML = `
        <h2>${asteroid.name}</h2>
        <span class="asteroid-type ${typeClass}">${asteroid.type}</span>
        
        <div class="asteroid-info">
            <div class="info-item">
                <span class="info-label">Distance</span>
                <span class="info-value">${asteroid.distance}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Velocity</span>
                <span class="info-value">${asteroid.velocity}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Diameter</span>
                <span class="info-value">${asteroid.diameter} m</span>
            </div>
            <div class="info-item">
                <span class="info-label">Weight</span>
                <span class="info-value">${formatWeight(asteroid.weight)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Magnitude</span>
                <span class="info-value">H ${asteroid.magnitude}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Orbit Radius</span>
                <span class="info-value">${asteroid.orbitRadius} AU</span>
            </div>
        </div>
        
        <div class="asteroid-date">
            📅 ${asteroid.date}
        </div>
    `;

    return tile;
}

// Format weight for display
function formatWeight(weight) {
    if (weight >= 1000000) {
        return `${(weight / 1000000).toFixed(1)}M tons`;
    } else if (weight >= 1000) {
        return `${(weight / 1000).toFixed(1)}K tons`;
    } else {
        return `${weight} tons`;
    }
}

// Handle asteroid selection
function selectAsteroid(asteroid) {
    // Store selected asteroid in localStorage
    localStorage.setItem('selectedAsteroid', JSON.stringify(asteroid));
    
    // Hide selection page
    document.getElementById('selection-page').style.display = 'none';
    
    // Show visualization container
    const mainContainer = document.getElementById('main-container');
    mainContainer.style.display = 'block';
    
    // Initialize the 3D visualization
    if (typeof initializeVisualization === 'function') {
        initializeVisualization();
    }
    
    console.log('Selected asteroid:', asteroid.name);
}
