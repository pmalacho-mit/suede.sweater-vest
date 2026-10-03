import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import sweaterVest from "./release/vite-plugin/plugin.ts";
import namespaceTests from "./suede.nests.sweater-vest/vite-plugin/plugin.mts";

export default defineConfig({
  plugins: [
    sveltekit(),
    sweaterVest({
      // the library's own components carry snippets that test and document them;
      // its fixtures are inputs to its namespace tests, not tests of their own
      _scanSelf: true,
      exclude: [
        "release/_internal/**",
        "release/vendored/**",
        "suede.nests/**",
        "suede.nests.sweater-vest/**",
      ],
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
      sweaterVest.project(),
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
