/*
 * Initialize the Spacekit viewer and display a 3D model of the Earth.
 * Ensure you have included spacekit.js and its dependencies in your HTML.
 */

// Declare viz globally so asteroid.js can access it
let viz;

// Visual radius used for Earth in the scene (scene units)
const EARTH_VISUAL_RADIUS = 1.0;
// Function to initialize the visualization
function initializeVisualization() {
    const mainContainer = document.getElementById('main-container');
    
    // Initialize the Spacekit viewer (make it global so asteroid.js can access it)
    viz = new Spacekit.Simulation(mainContainer, {
        basePath: 'https://typpo.github.io/spacekit/src',
        // Enable camera controls
        camera: {
            enableDrift: true,
        },
        // Set initial camera position - much closer to Earth
        // initialCameraPosition: [0, 0, -100],
    });

    // Add stars in the background for a more realistic space environment
    viz.createStars();

        viz.createSphere('earth', {
            textureUrl: './images/earth.jpg',
            position: [0, 0, 0],
            radius: EARTH_VISUAL_RADIUS,
        });

    // Log when simulation is ready
    console.log('3D Earth model loaded successfully!');
    
    // Load asteroid after Earth is created
    if (typeof window.loadAsteroid === 'function') {
        window.loadAsteroid();
    }
}

/*
 * Compute a global AU -> scene units scaling factor.
 * Strategy:
 * - If we have the semi-major axis (a, in AU) for the selected object, compute
 *   a scale so the orbit fits comfortably inside the visible container and
 *   clears Earth's visual radius.
 * - Otherwise fall back to a reasonable default.
 */
function computeSceneScale(aAU) {
    const SAFETY_MARGIN = 0.6; // extra clearance beyond Earth's radius

    // Fallback default
    const DEFAULT_AU_TO_SCENE = 1000;

    if (!aAU || aAU <= 0) {
        return DEFAULT_AU_TO_SCENE;
    }

    const container = document.getElementById('main-container');
    const w = (container && container.clientWidth) || window.innerWidth;
    const h = (container && container.clientHeight) || window.innerHeight;
    // available radius in scene pixels/units (we use CSS pixels as proxy for scene units)
    const available = Math.min(w, h) / 2 * 0.85; // leave some UI margin

    // Minimum visible orbit radius (so it doesn't clip Earth)
    const minOrbit = (EARTH_VISUAL_RADIUS + SAFETY_MARGIN) * 1.2;

    // Desired a_scene: try to fit the orbit within available space, but ensure minimum
    let desiredA_scene = Math.max(minOrbit, Math.min(available * 0.9, aAU * DEFAULT_AU_TO_SCENE));

    // Compute scale factor
    const AU_TO_SCENE = desiredA_scene / aAU;
    // Bound the scale to avoid extreme values
    const minScale = 50;
    const maxScale = 100000;
    return Math.max(minScale, Math.min(maxScale, AU_TO_SCENE));
}

// Expose globally
window.computeSceneScale = computeSceneScale;
