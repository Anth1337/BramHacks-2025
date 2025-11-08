/**
 * Create an asteroid that orbits Earth using Spacekit's createSphere method
 * This file should be loaded after app.js
 */

console.log('Creating asteroid orbiting Earth...');

// Create an asteroid using createSphere with orbital parameters
viz.createSphere('asteroid', {

    textureUrl: './images/asteroid_bennu.png', // Asteroid texture
    radius: 0.15, // Exaggerate asteroid's size

    levelsOfDetail: [
        { radii: 0, segments: 64 },
        { radii: 30, segments: 16 },
        { radii: 60, segments: 8 },
    ],
    
    rotation: {
        enable: true,
        speed: 2,
    },

    // Orbital parameters for a perfect circular orbit around Earth at [0,0,0]
    ephem: new Spacekit.Ephem({
        epoch: 2458600.5, // Julian date
        a: 2.5, // Semi-major axis - orbit radius (in scene units)
        e: 0.0, // Eccentricity = 0 for perfect circular orbit
        i: 0, // Inclination = 0 degrees for orbit in xy-plane
        om: 0, // Longitude of ascending node
        w: 0, // Argument of perihelion
        ma: 0, // Mean anomaly (starting position)
    }),
});

console.log('Asteroid created and orbiting Earth!');
