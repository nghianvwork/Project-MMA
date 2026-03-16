import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const DEFAULT_API_BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

const normalizeApiBaseUrl = (value) =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

const extractHostFromBundleUrl = (bundleUrl) => {
  const raw = String(bundleUrl || "").trim();
  if (!raw) {
    return "";
  }

  const match = raw.match(/^(?:https?|exp):\/\/([^/:?#]+)(?::\d+)?/i);
  return match?.[1] || "";
};

const extractHostFromHostPort = (hostPortValue) => {
  const raw = String(hostPortValue || "").trim();
  if (!raw) {
    return "";
  }
  return raw.split(":")[0] || "";
};

const getEnvironmentCandidates = () => {
  const rawValues = [
    process.env.EXPO_PUBLIC_API_BASE_URL,
    process.env.EXPO_PUBLIC_API_BASE_URL_FALLBACK,
    process.env.EXPO_PUBLIC_API_BASE_URL_2,
  ];

  return rawValues
    .flatMap((value) => String(value || "").split(","))
    .map(normalizeApiBaseUrl)
    .filter(Boolean);
};

const getWebCandidates = () => {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return [];
  }

  const hostName = window.location?.hostname || "localhost";

  return [
    `http://${hostName}:3000`,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .map(normalizeApiBaseUrl)
    .filter(Boolean);
};

const getNativeDevCandidates = () => {
  if (Platform.OS === "web") {
    return [];
  }

  const expoHostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    "";

  const scriptUrl =
    NativeModules?.SourceCode?.scriptURL ||
    NativeModules?.SourceCode?.scriptUrl ||
    "";

  const platformServerHost =
    NativeModules?.PlatformConstants?.ServerHost ||
    NativeModules?.PlatformConstants?.serverHost ||
    "";

  const hosts = [
    extractHostFromBundleUrl(scriptUrl),
    extractHostFromBundleUrl(expoHostUri),
    extractHostFromHostPort(expoHostUri),
    extractHostFromHostPort(platformServerHost),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (hosts.length === 0) {
    return [];
  }

  return [...new Set(hosts)]
    .map((host) => `http://${host}:3000`)
    .map(normalizeApiBaseUrl)
    .filter(Boolean);
};

const getOrderedApiBaseCandidates = () => {
  if (Platform.OS === "web") {
    return [
      ...new Set([
        ...getEnvironmentCandidates(),
        ...getWebCandidates(),
        normalizeApiBaseUrl(DEFAULT_API_BASE_URL),
      ]),
    ];
  }

  return [
    ...new Set([
      ...getNativeDevCandidates(),
      ...getEnvironmentCandidates(),
      normalizeApiBaseUrl(DEFAULT_API_BASE_URL),
    ]),
  ];
};

export const API_BASE_CANDIDATES = getOrderedApiBaseCandidates();

export const formatApiBaseCandidates = () => API_BASE_CANDIDATES.join(", ");

export const requestJsonWithFallback = async (path, options = {}) => {
  let lastError = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      const data = await response.json().catch(() => ({}));
      return { response, data, baseUrl };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("NETWORK_ERROR");
};
