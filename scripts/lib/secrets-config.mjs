export const INFISICAL_CONFIG = {
  domain: "https://infisical.phantasy.bot",
  projectId: "c6ff9395-a454-422b-99ed-17e24c1e90fc",
  secretPath: "/",
  secretType: "shared",
  environments: {
    dev: {
      name: "dev",
      workingFile: ".env",
      infisicalBackupFile: "tmp/secrets/chronicle.dev.env",
      localMirrorFile: "tmp/secrets/chronicle.dev.local.env",
      expectedAcpNetwork: "base",
    },
    prod: {
      name: "prod",
      workingFile: ".env.phala",
      infisicalBackupFile: "tmp/secrets/chronicle.prod.env",
      localMirrorFile: "tmp/secrets/chronicle.prod.local.env",
      expectedAcpNetwork: "base",
    },
  },
};

export const INFISICAL_AUTH_ENV = [
  {
    name: "INFISICAL_ACCESS_TOKEN",
    required: "optional",
    description: "Direct bearer token for Infisical API access.",
  },
  {
    name: "INFISICAL_MACHINE_CLIENT_ID",
    required: "conditional",
    description: "Machine identity client ID when not using INFISICAL_ACCESS_TOKEN.",
  },
  {
    name: "INFISICAL_MACHINE_CLIENT_SECRET",
    required: "conditional",
    description: "Machine identity client secret when not using INFISICAL_ACCESS_TOKEN.",
  },
  {
    name: "CF_ACCESS_CLIENT_ID",
    required: "conditional",
    description: "Cloudflare Access client id when the Infisical host is protected.",
  },
  {
    name: "CF_ACCESS_CLIENT_SECRET",
    required: "conditional",
    description: "Cloudflare Access client secret when the Infisical host is protected.",
  },
];

export const SECRETS_SCRIPT_DESCRIPTIONS = {
  "secrets:pull:dev": "Pull Infisical `dev` into the local working `.env` file.",
  "secrets:pull:prod": "Pull Infisical `prod` into the local working `.env.phala` file.",
  "secrets:push:dev": "Push the local `.env` working file back to Infisical `dev`.",
  "secrets:push:prod": "Push the local `.env.phala` working file back to Infisical `prod`.",
  "secrets:backup:dev": "Write an Infisical snapshot of `dev` to `tmp/secrets/chronicle.dev.env`.",
  "secrets:backup:prod": "Write an Infisical snapshot of `prod` to `tmp/secrets/chronicle.prod.env`.",
  "secrets:mirror:dev": "Copy the local `.env` working file to `tmp/secrets/chronicle.dev.local.env`.",
  "secrets:mirror:prod": "Copy the local `.env.phala` working file to `tmp/secrets/chronicle.prod.local.env`.",
  "secrets:mirror": "Refresh both local mirror files under `tmp/secrets/`.",
  "secrets:doctor": "Check gitignore coverage, local mirrors, and Infisical snapshot drift.",
  "virtuals:buyer-smoke": "Run a buyer-side ACP smoke test against a known provider wallet using separate buyer credentials.",
  "virtuals:find-entity": "Recover the ACP entity id and signer mapping for an agent wallet directly from Base.",
  "virtuals:generate-import": "Generate Virtuals job/resource import JSON from Chronicle's current ACP catalog.",
  "virtuals:check:dev": "Check whether `.env` is ready for Virtuals sandbox testing.",
  "virtuals:check:prod": "Check whether `.env.phala` is ready for hosted Virtuals deployment.",
  "docs:generate": "Regenerate environment and secrets docs from repo source files.",
  "docs:check": "Fail if generated docs are out of date.",
};
