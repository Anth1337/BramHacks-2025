import { useEffect, useState } from "react";
import type { Asteroid } from "./Home";
import AsteroidCard from "./AsteroidCard";
import React from "react";
import { getAsteroids } from "./Server";

const AsteroidGrid = (props: {}) =>
{
    const [asteroids, setAsteroids] = React.useState<Asteroid[]>([]);

    const pageSize = 20;
    const [page, setPage] = useState(0);
    const total = asteroids.length;
    // const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const totalPages = 461527;

    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = asteroids.slice(start, end);

    const handlePrev = () => setPage((p) => Math.max(0, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));


    useEffect(() =>
    {
        const fetchAsteroids = async () =>
        {
            const res = await getAsteroids(page);
            setAsteroids(res.asteroids);
        };
        fetchAsteroids();
    }, [, page]);

    return (
        <div style={{ color: "#fff" }}>
            {total === 0 ? (
                <p>No asteroids available.</p>
            ) : (
                <>
                    <div className="asteroid-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                        gap: "12px",
                        marginTop: "12px"
                    }}>
                        {pageItems.map((asteroid) => (
                            <div key={asteroid.full_name} className="asteroid-tile">
                                <AsteroidCard asteroid={asteroid} />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
                        <button onClick={handlePrev} disabled={page === 0} style={{ padding: "6px 10px" }}>Prev</button>
                        <div style={{ fontSize: "14px" }}>Page {page + 1} of {totalPages} — showing {pageItems.length} of {total}</div>
                        <button onClick={handleNext} disabled={page >= totalPages - 1} style={{ padding: "6px 10px" }}>Next</button>
                    </div>
                </>
            )}
        </div>
    )
}

export default AsteroidGrid;

