import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { AppDialogProvider } from "@/components/AppDialog";

import "./index.css";

// Registra os interceptors do Axios
import "@/services/http/interceptors";

import AppRoutes from "./routes";


createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <AppDialogProvider>
      <AppRoutes />
    </AppDialogProvider>

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

window.requestAnimationFrame(() => {
  document.documentElement.classList.remove("cfit-theme-booting");
});
