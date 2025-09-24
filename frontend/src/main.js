import "./assets/main.css";
import "./index.css";
import "vue3-toastify/dist/index.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router.js";
import { pinia } from "./stores";
import { useAuthStore } from "./stores/auth.js";

// Import Tailwind testing utilities for development
import { runTailwindDiagnostics } from "./utils/tailwind-test.js";

const app = createApp(App);

app.use(pinia).use(router);

// Initialize auth store BEFORE mounting the app
const authStore = useAuthStore();
authStore.initializeAuth();

app.mount("#app");

// Run Tailwind diagnostics in development mode
if (import.meta.env.DEV) {
  // Wait a bit for styles to load, then run diagnostics
  setTimeout(() => {
    runTailwindDiagnostics();
    console.log("\n💡 You can also run these commands in the console:");
    console.log("- window.tailwindTest.isTailwindWorking()");
    console.log("- window.tailwindTest.testTailwindUtilities()");
    console.log("- window.tailwindTest.runTailwindDiagnostics()");
  }, 1000);
}
