import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "backend/dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: [
      "src/hooks/useStore.tsx",
      "src/lib/api.ts",
      "src/pages/AthletesPage.tsx",
      "src/pages/student/Feed.tsx",
      "src/test/audit-coverage.test.ts",
      "backend/src/modules/events/events.controller.ts",
      "backend/src/modules/events/events.service.ts",
      "backend/src/modules/users/users.schema.ts",
      "backend/src/modules/users/users.service.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
