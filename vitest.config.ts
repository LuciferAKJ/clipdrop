import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  //   test: {
  //     environment: "jsdom",
  //     globals: true,
  //     setupFiles: ["./vitest.setup.ts"],

  //     include: [
  //       "tests/unit/**/*.test.{ts,tsx}",
  //       "tests/hooks/**/*.test.{ts,tsx}",
  //       "tests/components/**/*.test.{ts,tsx}",
  //       "tests/api/**/*.test.{ts,tsx}",
  //     ],

  //     coverage: {
  //   provider: "v8",
  //   reporter: ["text", "html", "lcov"],
  //   include: ["lib/**/*.ts", "hooks/**/*.ts", "components/providers/**/*.tsx"],
  //   exclude: [
  //     "**/node_modules/**",
  //     "**/.next/**",
  //     "**/prisma/generated/**",
  //     "**/*.d.ts",
  //     "**/*.config.ts",
  //   ],
  // },

  //       include: [
  //         "lib/**/*.ts",
  //         "hooks/**/*.ts",
  //         "components/providers/**/*.tsx",
  //       ],

  //       exclude: [
  //         "**/node_modules/**",
  //         "**/.next/**",
  //         "**/prisma/generated/**",
  //         "**/*.d.ts",
  //         "**/*.config.ts",
  //       ],
  //     },
  //   },

  //   resolve: {
  //     alias: {
  //       "@": path.resolve(__dirname, "."),
  //     },
  //   },
  // });

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],

    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/hooks/**/*.test.{ts,tsx}",
      "tests/components/**/*.test.{ts,tsx}",
      "tests/api/**/*.test.{ts,tsx}",
    ],

    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],

      include: [
        "lib/**/*.ts",
        "hooks/**/*.ts",
        "components/providers/**/*.tsx",
      ],

      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/prisma/generated/**",
        "**/*.d.ts",
        "**/*.config.ts",
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
