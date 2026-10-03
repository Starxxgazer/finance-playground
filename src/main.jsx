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
import pencilNotes from "./pencil-notes.css?inline";
import pencilMaterials from "./pencil-materials.css?inline";
function addStyles(text) {
  const style = document.createElement("style");
  style.textContent = text;
  document.head.append(style);
}
async function boot() {
  const query = new URLSearchParams(location.search);
  let content;
  // The review controls and example progress are development-only. Preview
  // progress never reads or writes a player's saved investigation.
  if (import.meta.env.DEV && query.has("ui-design")) {
    const { default: DesignReview } = await import("./design/DesignReview.jsx");
    content = <DesignReview />;
  } else if (import.meta.env.DEV && query.has("ui-preview")) {
    const { makePreview, installTheme } = await import("./design/preview.js");
    await import("./design/directions.css");
    addStyles(pencilMaterials);
    installTheme(query.get("variant"));
    content = <App preview={makePreview(query.get("ui-preview"))} />;
  } else {
    document.documentElement.dataset.ui = "notebook";
    addStyles(pencilNotes + pencilMaterials);
    content = <App />;
  }
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>{content}</React.StrictMode>,
  );
}
boot();
