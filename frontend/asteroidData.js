/**
 * Local database of notable asteroids
 */

const asteroidDatabase = [
    {
        id: 1,
        name: "2025 AB",
        type: "Near Miss",
        date: "2025-11-05",
        distance: "0.0031 AU",
        velocity: "18.2 km/s",
        magnitude: 22.1,
        diameter: 15, // estimated in meters
        weight: 3375, // estimated in tons (assuming density ~2.5 g/cm³)
        orbitRadius: 0.0031, // in AU
        composition: 'unknown — likely stony or carbonaceous',
        ephem: {
            epoch: 2461000.5,
            a: 0.954,
            e: 0.334,
            i: 9.97,
            om: 283,
            w: 294,
            ma: 264,
        },
    },
    {
        id: 2,
        name: "2024 XY",
        type: "Near Miss",
        date: "2024-12-13",
        distance: "0.0026 AU",
        velocity: "11.4 km/s",
        magnitude: 24.5,
        diameter: 10, // estimated in meters
        weight: 1000, // estimated in tons
        orbitRadius: 0.0026, // in AU
        composition: 'unknown — likely carbonaceous or stony',
        ephem: {
            epoch: 2460646.5,
            a: 1.80,
            e: 0.513,
            i: 2.22,
            om: 9.92,
            w: 358,
            ma: 18.3,
        },
    },
    {
        id: 3,
        name: "101955 Bennu",
        type: "Reference",
        date: "Known",
        distance: "0.003 AU",
        velocity: "12.6 km/s",
        magnitude: 20.2,
        diameter: 490, // meters
        weight: 78000000, // estimated in tons
        orbitRadius: 0.003, // in AU
        composition: 'carbonaceous (B-type)',
        ephem: {
            epoch: 2455562.5,
            a: 1.13,
            e: 0.204,
            i: 6.03,
            om: 2.06,
            w: 66.2, // 66.2
            ma: 102,
        },
    },
    {
        id: 4,
        name: "99942 Apophis",
        type: "Near Miss (2029)",
        date: "2029-04-13",
        distance: "0.00026 AU",
        velocity: "7.4 km/s",
        magnitude: 19.7,
        diameter: 370, // meters
        weight: 27000000, // estimated in tons
        orbitRadius: 0.00026, // in AU
        composition: 'stony (S-type)',
        ephem: {
            epoch: 2461000.5,
            a: 0.922,
            e: 0.191,
            i: 3.34,
            om: 204,
            w: 127,
            ma: 313,
        },
    },
    {
        id: 5,
        name: "65803 Didymos",
        type: "Reference",
        date: "2022 DART",
        distance: "0.039 AU",
        velocity: "6.1 km/s",
        magnitude: 18.2,
        diameter: 780, // meters
        weight: 500000000, // estimated in tons
        orbitRadius: 0.039, // in AU
        composition: 'rubble-pile / mixed (Xk)',
        ephem: {
            epoch: 2461000.5,
            a: 1.64,
            e: 0.383,
            i: 3.41,
            om: 73,
            w: 320,
            ma: 167,
        },
    },
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = asteroidDatabase;
}
