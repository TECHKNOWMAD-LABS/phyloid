import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Enforce explicit return types on exported functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Warn on any → prefer type-safe code
      "@typescript-eslint/no-explicit-any": "warn",
      // Warn on unused vars (allow underscore-prefixed)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      // Security: no eval-like constructs
      "no-eval": "error",
      "no-implied-eval": "error",
      // Prefer const
      "prefer-const": "error",
      // No console in src (warn to allow debugging)
      "no-console": "warn",
    },
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
);
