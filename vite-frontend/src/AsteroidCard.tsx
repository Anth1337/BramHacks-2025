import type { FC } from "react";
import type { Asteroid } from "./Home";
import { useNavigate } from "react-router-dom";

const AsteroidCard: FC<{ asteroid: Asteroid }> = ({ asteroid }) =>
{
    const navigate = useNavigate();

    const onCardClick = () =>
    {
        navigate(`/asteroid/${asteroid.spkid}`);
    }

    return (
        <div className="asteroid-card"
            onClick={() => onCardClick()}
            style={{
                background: "#0b0b0b",
                border: "1px solid #222",
                padding: "12px",
                borderRadius: "6px",
                color: "#fff",
                minWidth: "220px",

                textAlign: "left"
            }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{asteroid.full_name}</h3>
            <table>
                <tbody>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Absolute Magnitude (H):</td>
                        <td><strong>{Number(asteroid.H).toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Semi-major Axis (a):</td>
                        <td><strong>{Number(asteroid.a).toFixed(3)} AU</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Eccentricity (e):</td>
                        <td><strong>{Number(asteroid.e).toFixed(4)}</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Inclination (i):</td>
                        <td><strong>{Number(asteroid.i).toFixed(2)}°</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Epoch:</td>
                        <td><strong>{asteroid.epoch}</strong></td>
                    </tr>

                    <tr>
                        <td style={{ paddingRight: "8px" }}>Mean Anomaly (MA):</td>
                        <td><strong>{Number(asteroid.ma).toFixed(2)}°</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Argument of Periapsis (w):</td>
                        <td><strong>{Number(asteroid.w).toFixed(2)}°</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Longitude of Ascending Node (OM):</td>
                        <td><strong>{Number(asteroid.om).toFixed(2)}°</strong></td>
                    </tr>
                    <tr>
                        <td style={{ paddingRight: "8px" }}>Minimum Orbit Intersection Distance (MOID):</td>
                        <td><strong>{Number(asteroid.moid).toFixed(6)} AU</strong></td>
                    </tr>

                </tbody>
            </table>
        </div>
    );
};

export default AsteroidCard;
