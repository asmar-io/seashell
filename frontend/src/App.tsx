import { Routes, Route } from "react-router";
import { HomePage, Creators } from "./pages";
import { Providers } from "./providers";
import CreatorPage from "./pages/shell/[id]";
import { Marketplace } from "./pages/marketplace";
import { PostContent } from "./pages/postcontent";

export default function App() {
  return (
    <Providers>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route index element={<Marketplace />} />
        <Route path="/postcontent" element={<PostContent />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="/shell/:id" element={<CreatorPage />} />
      </Routes>
    </Providers>
  );
}
