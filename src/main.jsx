import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./fonts.css";
import "./styles.css";
import "./immersive.css";
import "./game-ui.css";
import "./inventory.css";
import "./funds.css";
import "./scene-effects.css";
import "./game-materials.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
