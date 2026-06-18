export type ComposerAccessState = {
  isLocked: boolean;
  modeLabel: string;
};

export type ComposerRuntimeStatus = {
  access: ComposerAccessState;
  astraBaseUrl: string;
  composerPort: number;
  hasInternalToken: boolean;
  privateFeedEndpoint: string;
  onboardingEndpoint: string;
};

function clean(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "") || "";
}

export function getComposerAccessState(): ComposerAccessState {
  const isLocked = clean(process.env.COMPOSER_REQUIRE_AUTH) === "1";
  return {
    isLocked,
    modeLabel: isLocked ? composerUi.shell.accessLocked : composerUi.shell.localPreview
  };
}

export function getAstraBaseUrl() {
  return clean(process.env.ASTRA_APP_BASE_URL) || clean(process.env.ASTRA_APP_SMOKE_BASE_URL) || "http://localhost:3011";
}

export function getInternalToken() {
  return clean(process.env.ASTRA_INTERNAL_API_TOKEN);
}

export function getComposerRuntimeStatus(): ComposerRuntimeStatus {
  const astraBaseUrl = getAstraBaseUrl();
  return {
    access: getComposerAccessState(),
    astraBaseUrl,
    composerPort: 3012,
    hasInternalToken: Boolean(getInternalToken()),
    privateFeedEndpoint: `${astraBaseUrl}/api/composer/private-feed-items`,
    onboardingEndpoint: `${astraBaseUrl}/api/composer/onboarding-cards`
  };
}

export async function postToAstra<TPayload>(path: string, payload: TPayload) {
  const internalToken = getInternalToken();
  if (!internalToken) {
    return {
      ok: false,
      status: 500,
      body: { error: "ASTRA_INTERNAL_API_TOKEN_REQUIRED" }
    } as const;
  }

  const response = await fetch(`${getAstraBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-astra-internal-token": internalToken
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as unknown) : {};
  return { ok: response.ok, status: response.status, body } as const;
}
import { composerUi } from "./i18n";
