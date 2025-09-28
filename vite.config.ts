import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"]
  },
  resolve: {
    // もし webpack のエイリアスを使っているなら合わせて記述
    // alias: {
    //   "@": new URL("./src/", import.meta.url).pathname,
    // },
  },
});
