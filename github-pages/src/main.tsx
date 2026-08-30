import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AddSite, SiteHub } from "../../app/site-hub";
import "../../app/globals.css";

function GitHubPagesApp() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const updateRoute = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);

  return route === "#/add" ? <AddSite /> : <SiteHub />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GitHubPagesApp />
  </StrictMode>,
);
