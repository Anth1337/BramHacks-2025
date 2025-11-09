/**
 * Asteroid selection page functionality
 */

let currentSortBy = 'name';
let asteroids = []; // Will be populated from NASA API
let isLoading = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadAsteroidsFromAPI();
    setupEventListeners();
});

// Load asteroids from NASA API via FastAPI backend
async function loadAsteroidsFromAPI() {
    if (isLoading) return;
    isLoading = true;
    
    const grid = document.getElementById('asteroid-grid');
    grid.innerHTML = '<div style="padding:20px;text-align:center;">Loading asteroids from NASA JPL...</div>';
    
    try {
        // Fetch from FastAPI endpoint which proxies NASA JPL SBDB
        const response = await fetch('http://localhost:8080/asteroids?page=0&page_size=50');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const nasaAsteroids = data.asteroids || [];
        
        // Transform NASA data to our format
        asteroids = nasaAsteroids.map((ast, index) => {
            // NASA returns: full_name, epoch, a, e, i, om, w, ma, H, moid
            const diameter = estimateDiameterFromH(parseFloat(ast.H) || 20);
            const weight = estimateWeightFromDiameter(diameter);
            
            return {
                id: index + 1,
                name: ast.full_name || `Asteroid ${index + 1}`,
                type: 'NEO Candidate',
                distance: ast.moid ? `${parseFloat(ast.moid).toFixed(4)} AU` : 'N/A',
                velocity: 'N/A', // Not provided by SBDB query API
                diameter: Math.round(diameter), // in meters
                diameter_km: diameter / 1000,
                weight: Math.round(weight),
                magnitude: parseFloat(ast.H) || 20,
                orbitRadius: parseFloat(ast.a) || 1.0,
                date: ast.epoch || 'N/A',
                composition: 'unknown', // Not provided by SBDB query API
                ephem: {
                    epoch: parseFloat(ast.epoch) || 2451545.0,
                    a: parseFloat(ast.a) || 1.0,
                    e: parseFloat(ast.e) || 0,
                    i: parseFloat(ast.i) || 0,
                    om: parseFloat(ast.om) || 0,
                    w: parseFloat(ast.w) || 0,
                    ma: parseFloat(ast.ma) || 0
                }
            };
        });
        
        console.log(`Loaded ${asteroids.length} asteroids from NASA JPL SBDB`);
        renderAsteroids();
        
    } catch (error) {
        console.error('Failed to load asteroids from API:', error);
        grid.innerHTML = `
            <div style="padding:20px;text-align:center;color:#c33;">
                <p>Failed to load asteroids from NASA API.</p>
                <p>Make sure the FastAPI backend is running on port 8000.</p>
                <p style="font-size:12px;">Error: ${error.message}</p>
                <button onclick="loadAsteroidsFromAPI()" style="margin-top:10px;padding:8px 16px;cursor:pointer;">Retry</button>
            </div>
        `;
        
        // Fallback to local database if available
        if (typeof asteroidDatabase !== 'undefined' && Array.isArray(asteroidDatabase) && asteroidDatabase.length > 0) {
            console.log('Falling back to local asteroid database');
            asteroids = [...asteroidDatabase];
            renderAsteroids();
        }
    } finally {
        isLoading = false;
    }
}

// Estimate diameter from absolute magnitude H
// Using: D(km) = 1329 / sqrt(albedo) * 10^(-H/5)
// Assuming average albedo of 0.14 for unknown composition
function estimateDiameterFromH(H, albedo = 0.14) {
    const diameterKm = (1329 / Math.sqrt(albedo)) * Math.pow(10, -H / 5);
    return diameterKm * 1000; // Convert to meters
}

// Estimate weight from diameter (very rough)
// Assuming average density of ~2500 kg/m^3
function estimateWeightFromDiameter(diameterMeters) {
    const radiusMeters = diameterMeters / 2;
    const volumeM3 = (4/3) * Math.PI * Math.pow(radiusMeters, 3);
    const densityKgPerM3 = 2500; // Average for rocky asteroids
    const massKg = volumeM3 * densityKgPerM3;
    const massTons = massKg / 1000;
    return massTons;
}

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
    
    // Dispatch custom event to notify overlay of the change
    window.dispatchEvent(new CustomEvent('asteroidSelected', { detail: asteroid }));
    
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
