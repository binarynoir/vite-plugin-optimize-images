// @ts-check
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  // VitePress writes pre-bundled deps (e.g. vue.js) to .vitepress/cache; never lint them.
  { ignores: ["dist/**", ".vitepress/cache/**", ".vitepress/dist/**"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  eslintConfigPrettier,
);
