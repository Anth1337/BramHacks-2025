import { Route, Routes } from "react-router-dom"
import Home from "./Home"
import AsteroidDetail from "./AsteroidDetail"

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/asteroid/:spkid" element={<AsteroidDetail />} />
        </Routes>
    )
}

export default AppRouter