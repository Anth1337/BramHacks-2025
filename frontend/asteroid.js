/**
 * Create an asteroid that orbits Earth using Spacekit's createSphere method
 * This file should be loaded after app.js
 */

// Function to load asteroid (called after viz is initialized)
window.loadAsteroid = function () {
    if (!viz) {
        console.error('Viz not initialized yet');
        return;
    }

    // Get selected asteroid from localStorage
    const selectedAsteroidData = localStorage.getItem('selectedAsteroid');
    if (!selectedAsteroidData) {
        console.error('No asteroid selected');
        return;
    }

    const asteroid = JSON.parse(selectedAsteroidData);
    console.log('Creating asteroid orbiting Earth:', asteroid.name);

    // Use ephemeris from the selected asteroid when available
    const ep = asteroid.ephem || null;

    // Use computeSceneScale (provided by app.js) to choose AU->scene scaling
    let AU_TO_SCENE = 1000;
    let a_scene;
    if (ep && typeof ep.a === 'number') {
        if (typeof window.computeSceneScale === 'function') {
            AU_TO_SCENE = window.computeSceneScale(ep.a);
        }
        a_scene = ep.a * AU_TO_SCENE;
    } else {
        const fallbackAU = asteroid.orbitRadius || 0.003;
        if (typeof window.computeSceneScale === 'function') {
            AU_TO_SCENE = window.computeSceneScale(fallbackAU);
        }
        a_scene = fallbackAU * AU_TO_SCENE;
    }

    // Bring the orbit visually closer to Earth for easier viewing while preserving
    // the orbital shape (eccentricity, inclination, angles). We scale the
    // semi-major axis down by a view factor but ensure it stays outside the
    // Earth's visual radius + safety margin so it doesn't clip the planet.
    const EARTH_VISUAL_RADIUS = 0.6;
    const SAFETY_MARGIN = 0.6;

    // Choose a view factor between 0.05 and 0.5 (smaller => orbit closer to Earth)
    // We bias smaller orbits to use a slightly larger factor so they remain visible.
    let viewFactor = 0.05;
    if (ep && ep.a && ep.a < 0.01) {
        viewFactor = 0.2;
    } else if (ep && ep.a && ep.a > 0.05) {
        viewFactor = 0.08;
    }

    // Compute the viewed semi-major axis, then clamp to a comfortable viewing range
    let a_scene_view = Math.max(a_scene * viewFactor, EARTH_VISUAL_RADIUS + SAFETY_MARGIN);

    // For best viewing, force the visual semi-major axis to fall between 2 and 10 scene units
    const VIEW_MIN = 2.0;
    const VIEW_MAX = 10.0;
    if (a_scene_view < VIEW_MIN) a_scene_view = VIEW_MIN;
    if (a_scene_view > VIEW_MAX) a_scene_view = VIEW_MAX;

    // Build ephem object for Spacekit (angles in degrees)
    const ephemForScene = ep ? {
        epoch: ep.epoch || 2458600.5,
        a: a_scene_view,
        e: ep.e || 0.0,
        i: ep.i || 0.0,
        om: ep.om || 0.0,
        w: ep.w || 0.0,
        ma: ep.ma || 0.0,
    } : null;

    // Create an asteroid as a SpaceObject (createObject) so it supports orbits and labels
    const asteroidObj = viz.createObject('asteroid', {
        textureUrl: './images/asteroid_bennu.png', // Asteroid texture (if supported)
        radius: Math.max(0.05, asteroid.diameter / 5000), // visual radius
        labelText: asteroid.name,
        hideOrbit: false,
        theme: {
            color: 0xff6b35,
            orbitColor: 0x00ff00,
        },
        rotation: {
            enable: true,
            speed: 2,
        },
        // Use the ephemeris (scaled for view) — pass degrees
        ephem: ephemForScene ? new Spacekit.Ephem(ephemForScene, 'deg') : null,
    });

    console.log('Asteroid created and orbiting Earth!', {
        name: asteroid.name,
        a_scene: a_scene,
        original_a: ep ? ep.a : asteroid.orbitRadius,
        diameter: asteroid.diameter,
        distance: asteroid.distance
    });
};
