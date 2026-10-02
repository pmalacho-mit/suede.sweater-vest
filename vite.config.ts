import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import sweaterVest from "./release/vite-plugin/plugin.ts";
import namespaceTests from "./sweater-vest-suede.typescript-namespace-tests-suede/vite-plugin/plugin.mts";

export default defineConfig({
  plugins: [
    sveltekit(),
    sweaterVest({
      project: "sweater",
      external: process.env.SWEATER_VEST_PORT
        ? `http://localhost:${process.env.SWEATER_VEST_PORT}`
        : undefined,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: true,
        resolve: { conditions: ["browser"] },
        test: {
          name: "sweater",
          environment: "jsdom",
          include: [],
        },
      },
      {
        extends: true,
        // the library's own tests are namespace tests, written beside what they test
        plugins: [
          namespaceTests({
            exclude: ["src/**", "release/vendored/**"],
          }),
        ],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
