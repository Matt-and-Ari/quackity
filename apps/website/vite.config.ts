import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  envDir: "../..",
  plugins: [react(), tailwindcss()],
});
