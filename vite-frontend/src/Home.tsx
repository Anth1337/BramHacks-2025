import React from "react";
import AsteroidGrid from "./AsteroidGrid";


export type Asteroid = {
    full_name: string;
    spkid: number;
    epoch: number;
    a: number;
    e: number;
    i: number;
    om: number;
    w: number;
    ma: number;
    H: number;
    moid: number;
}


const Home: React.FC = () =>
{
    


    // useEffect(() =>
    // {
    //     // inject external scripts in order
    //     const scriptSrcs = [
    //         "asteroidData.js",
    //         "https://typpo.github.io/spacekit/build/spacekit.js",
    //         "selection.js",
    //         "app.js",
    //         "asteroid.js",
    //         "Overlay.js",
    //     ];
    //     const scripts: HTMLScriptElement[] = scriptSrcs.map((src) =>
    //     {
    //         const s = document.createElement("script");
    //         s.src = src;
    //         s.async = false; // preserve execution order
    //         document.body.appendChild(s);
    //         return s;
    //     });

    //     return () =>
    //     {
    //         // cleanup inserted elements when component unmounts
    //         links.forEach((l) => l.remove());
    //         scripts.forEach((s) => s.remove());
    //     };
    // }, []);

    return (
        <>
            <div id="selection-page">
                <div className="container">
                    <header>
                        <h1>YarkNet - Notable Asteroids</h1>
                        <p className="subtitle">Select an asteroid to visualize its orbit around Earth</p>
                    </header>

                    <div className="controls">
                        <label htmlFor="sort-select">Sort by:</label>
                        <select id="sort-select" name="sort-select">
                            <option value="name">Name</option>
                            <option value="weight">Weight</option>
                            <option value="diameter">Diameter</option>
                            <option value="orbitRadius">Orbit Radius</option>
                            <option value="date">Date</option>
                        </select>
                    </div>

                    <AsteroidGrid />
                </div>
            </div>

            {/* 3D Visualization Page (hidden initially) */}
            <div id="main-container" />
        </>
    );
};

export default Home;
