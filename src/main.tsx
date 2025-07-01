import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App";
import StoreProvider from "./store/StoreProvider";

createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>
);
