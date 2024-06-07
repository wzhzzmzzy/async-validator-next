import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["html"],
    },
    silent: false,
  },
})
