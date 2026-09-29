export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 60],
    "subject-case": [2, "always", "lower-case"],
    "body-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "build", "chore", "ci", "docs", "style", "test", "perf", "refactor"],
    ],
    "trailer-exists": [0],
  },
};
