import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

  return {
    base:
      process.env.GITHUB_ACTIONS === "true" && repoName ? `/${repoName}/` : "/",
    plugins: [react()],
  };
});
