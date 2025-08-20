import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle unhandled promise rejections globally
window.addEventListener("unhandledrejection", (event) => {
  console.warn("Unhandled promise rejection:", event.reason);
  // Prevent the error from being logged to console as an uncaught error
  event.preventDefault();
});

// Handle uncaught errors
window.addEventListener("error", (event) => {
  console.warn("Uncaught error:", event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
