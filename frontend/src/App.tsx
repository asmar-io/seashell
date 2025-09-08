import { Routes, Route } from "react-router";
import { HomePage, Dashboard } from "./pages";
import { Providers } from "./providers";
import CreatorPage from "./pages/shell/[id]";

export default function App() {
  return (
    <Providers>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shell/:id" element={<CreatorPage />} />
      </Routes>
    </Providers>
  );
}
