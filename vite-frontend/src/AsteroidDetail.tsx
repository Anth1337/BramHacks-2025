import { useEffect, useState } from "react";
import { Col, Container, Row, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getAsteroid, getDriftData } from "./Server";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const AsteroidDetail: React.FC = () =>
{
    const navigate = useNavigate();
    const [asteroid, setAsteroid] = useState<any>();
    // const [driftValue, setDriftValue] = useState<number>(0);
    const [drift, setDrift] = useState<{ da_dt: number; units: string } | null>(null);

    useEffect(() =>
    {
        const pathnameParts = window.location.pathname.split("/").filter(Boolean);
        const id = pathnameParts[pathnameParts.length - 1];

        const fetchAsteroidAndDrift = async () =>
        {
            const res = await getAsteroid({ id });
            setAsteroid(res.asteroid);

            const { object, orbit, phys_par } = res.asteroid;
            // pick key parameters for your model
            const params = {
                H: parseFloat(phys_par?.find((p: any) => p.name === "H")?.value ?? 20),
                a: parseFloat(orbit?.elements?.a ?? 1),
                e: parseFloat(orbit?.elements?.e ?? 0),
            };

            try
            {
                const driftRes = await getDriftData(params);
                setDrift(driftRes);
            } catch (err)
            {
                console.error("Failed to fetch drift:", err);
            }
        };

        fetchAsteroidAndDrift();
    }, []);


    // useEffect(() =>
    // {
    //     const pathnameParts = window.location.pathname.split("/").filter(Boolean);
    //     const id = pathnameParts[pathnameParts.length - 1];

    //     const fetchAsteroid = async () =>
    //     {
    //         const res = await getAsteroid({ id });
    //         setAsteroid(res.asteroid);
    //     };
    //     fetchAsteroid();
    // }, []);

    // useEffect(() =>
    // {
    //     if (!asteroid) return;  


    //     const fetchDrift = async () =>
    //     {
    //         const res = await getDriftData({ a: asteroid.a, e: asteroid.e, H: asteroid.H });
    //         setDriftValue(res.drift);
    //     }
    //     fetchDrift();
    // }, [asteroid]);



    if (!asteroid) return <div>Loading asteroid data...</div>;

    // === Parse SBDB data ===
    const { object, orbit, phys_par } = asteroid;
    const getPhys = (key: string) =>
        phys_par?.find((p: any) => p.name === key)?.value ?? "—";

    const getOrbitVal = (key: string) =>
    {
        return orbit?.elements?.find((el: any) => el.name === key)?.value ?? "—";
    };

    const getOrbitUnit = (key: string) =>
    {
        return orbit?.elements?.find((el: any) => el.name === key)?.units ?? "";
    };


    console.log("Asteroid data:", asteroid);

    return (
        <Container fluid className="p-4">
            {/* === Top Left: Yarkovsky Drift Graph === */}
            <Col md={6}>
                <Card className="bg-dark text-light h-100">
                    <Card.Header>Yarkovsky Drift Over Time</Card.Header>
                    <Card.Body>
                        {drift ? (
                            <>
                                <div className="mb-3">
                                    <b>Drift Rate:</b> {drift.da_dt.toExponential(3)} {drift.units}
                                </div>

                                {/* Simulate cumulative effect over time */}
                                <div className="chart-container">
                                    <Line
                                        data={{
                                            labels: Array.from({ length: 10 }, (_, i) => `${2015 + i}`),
                                            datasets: [
                                                {
                                                    label: `Cumulative Δa (${drift.units})`,
                                                    data: Array.from({ length: 10 }, (_, i) => drift.da_dt * (i + 1)),
                                                    borderColor: "#00d4ff",
                                                    backgroundColor: "rgba(0, 212, 255, 0.2)",
                                                    fill: true,
                                                    tension: 0.25,
                                                },
                                            ],
                                        }}
                                        options={{
                                            scales: {
                                                y: {
                                                    title: { display: true, text: "Δa (AU)" },
                                                    suggestedMin: drift.da_dt * 15,
                                                    suggestedMax: -drift.da_dt * 15, // symmetric for ±drift
                                                },
                                                x: {
                                                    title: { display: true, text: "Year" },
                                                },
                                            },
                                            plugins: {
                                                legend: { labels: { color: "#e5e9f0" } },
                                            },
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div>Loading drift data…</div>
                        )}
                    </Card.Body>
                </Card>
            </Col>

            {/* === Top Right: Orbital + Approach === */}
            <Col md={6}>
                <Card className="bg-dark text-light h-100">
                    <Card.Header>Orbital Data & Close Approach</Card.Header>
                    <Card.Body>
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            <li>
                                <b>Semi-major axis (a):</b> {getOrbitVal("a")} {getOrbitUnit("a")}
                            </li>
                            <li>
                                <b>Eccentricity (e):</b> {getOrbitVal("e")}
                            </li>
                            <li>
                                <b>Inclination (i):</b> {getOrbitVal("i")} {getOrbitUnit("i")}
                            </li>
                            <li>
                                <b>MOID:</b> {orbit?.moid ?? "—"} AU
                            </li>
                        </ul>

                        <div className="mt-3 text-info">
                            Next Earth approach: coming soon…
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* === Bottom Left: Mining Potential === */}
            <Col md={6}>
                <Card className="bg-dark text-light h-100">
                    <Card.Header>Mining Potential</Card.Header>
                    <Card.Body>
                        <p>
                            <b>Potential:</b>{" "}
                            {asteroid?.mining_potential ? "High" : "Low"}
                        </p>
                        <p>
                            <b>Hazardous:</b> {asteroid?.is_hazardous ? "Yes" : "No"}
                        </p>
                        <p>
                            <b>Orbit Class:</b> {object?.orbit_class?.name ?? "N/A"}
                        </p>
                    </Card.Body>
                </Card>
            </Col>

            {/* === Bottom Right: Physical Composition === */}
            <Col md={6}>
                <Card className="bg-dark text-light h-100">
                    <Card.Header>Physical Properties</Card.Header>
                    <Card.Body>
                        <ul>
                            <li><b>Diameter:</b> {getPhys("diameter")} km</li>
                            <li><b>Albedo:</b> {getPhys("albedo")}</li>
                            <li><b>Mass:</b> {getPhys("mass")}</li>
                            <li><b>Density:</b> {getPhys("density")}</li>
                            <li><b>Rotation period:</b> {getPhys("rot_per")} hr</li>
                        </ul>
                    </Card.Body>
                </Card>
            </Col>
        </Container>
    );
};

export default AsteroidDetail;
