// Initialize the Spacekit viewer
const viz = new Spacekit.Simulation(document.getElementById('main-container'), {
    basePath: 'https://typpo.github.io/spacekit/src',
    // Enable camera controls
    camera: {
        enableDrift: true,
    },
    // Set initial camera position - much closer to Earth
    // initialCameraPosition: [0, 0, -100],
});

viz.createStars();

viz.createSphere('earth', {
  textureUrl: './earth.jpg',
});

// Optional: Add stars in the background for a more realistic space environment

// Log when simulation is ready
console.log('3D Earth model loaded successfully!');
console.log('Use your mouse to interact with the Earth:');
console.log('- Left-click and drag: Rotate view');
console.log('- Scroll wheel: Zoom in/out');
console.log('- Right-click and drag: Pan view');
