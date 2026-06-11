import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const generatedIgnores = {
  ignores: [
      "node_modules/**",
      ".next/**",
      "**/.next/**",
      "dist/**",
      "**/dist/**",
      "playwright-report/**",
      "**/playwright-report/**",
      "test-results/**",
      "**/test-results/**"
  ]
};

const eslintConfig = [
  generatedIgnores,
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];

export default eslintConfig;
