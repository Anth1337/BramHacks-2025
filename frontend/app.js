/*
 * Initialize the Spacekit viewer and display a 3D model of the Earth.
 * Ensure you have included spacekit.js and its dependencies in your HTML.
 */

// Initialize the Spacekit viewer (make it global so asteroid.js can access it)
let viz = new Spacekit.Simulation(document.getElementById('main-container'), {
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
});

// Log when simulation is ready
console.log('3D Earth model loaded successfully!');
