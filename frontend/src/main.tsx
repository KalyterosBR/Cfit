import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";

// Registra os interceptors do Axios
import "@/services/http/interceptors";

import AppRoutes from "./routes";


createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <AppRoutes />

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
        },
      }}
    />
  </StrictMode>,
);