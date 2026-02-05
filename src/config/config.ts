// TODO: Add selfModify.poweruser config option as alternative to env var. Support both
// OPENCLAW_SELF_MODIFY_POWERUSER=1 and { selfModify: { poweruser: true } }. Prefer config
// over env for production deployments.
export {
  createConfigIO,
  loadConfig,
  parseConfigJson5,
  readConfigFileSnapshot,
  resolveConfigSnapshotHash,
  writeConfigFile,
} from "./io.js";
export { migrateLegacyConfig } from "./legacy-migrate.js";
export * from "./paths.js";
export * from "./runtime-overrides.js";
export * from "./types.js";
export { validateConfigObject, validateConfigObjectWithPlugins } from "./validation.js";
export { OpenClawSchema } from "./zod-schema.js";
