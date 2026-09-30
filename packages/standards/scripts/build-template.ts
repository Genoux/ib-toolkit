import { join } from "node:path";
import { buildTemplate } from "../src/template";

const PACKAGE_ROOT = join(import.meta.dirname, "..");

buildTemplate(join(PACKAGE_ROOT, "..", "..", "apps", "template"), join(PACKAGE_ROOT, "template"));
