import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import fs from "node:fs";
// https://vite.dev/config/
const folderName = "cert";
const key = fs.readFileSync(path.join(__dirname, folderName, "cert.key"));
const cert = fs.readFileSync(path.join(__dirname, folderName, "cert.crt"));

console.log(__dirname);
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    https: {
      key,
      cert,
    },
  },
});
