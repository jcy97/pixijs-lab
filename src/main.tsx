import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AdvancedPixijsDrawingApp from "./AdvancedPixijsDrawingApp.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdvancedPixijsDrawingApp />
  </StrictMode>
);
