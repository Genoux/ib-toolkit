/**
 * Layer model shared by every inBeat app (see @inbeat/standards AGENTS block).
 * Apps extend this file and may add or relax rules by redefining a rule with the same name.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature",
      comment:
        "Features never import each other; share through entities/, shared/ or integrations/.",
      severity: "error",
      from: { path: "^src/features/([^/]+)/" },
      to: { path: "^src/features/([^/]+)/", pathNot: "^src/features/$1/" },
    },
    {
      name: "entities-are-leaf",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/(app|features|shared|integrations|db)/" },
    },
    {
      name: "db-imports-entities-only",
      severity: "error",
      from: { path: "^src/db/" },
      to: { path: "^src/(app|features|shared|integrations)/" },
    },
    {
      name: "shared-below-features",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(app|features)/" },
    },
    {
      name: "integrations-below-features",
      severity: "error",
      from: { path: "^src/integrations/" },
      to: { path: "^src/(app|features)/" },
    },
    {
      name: "features-below-app",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/app/" },
    },
    {
      name: "private-components",
      comment: "_components/ folders are private to the folder that contains them.",
      severity: "error",
      from: { path: "^(src/.+)/[^/]+$" },
      to: { path: "/_components/", pathNot: ["^$1/_components/", "^$1/"] },
    },
    {
      name: "no-circular",
      severity: "warn",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|\\.next)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
