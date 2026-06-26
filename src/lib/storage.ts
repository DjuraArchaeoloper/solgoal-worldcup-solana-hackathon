import type { UserPick } from "./txline/types";

const memoryStore = new Map<string, string>();

function safeWallet(walletAddress: string) {
  return walletAddress.trim();
}

function keyFor(walletAddress: string, key: string) {
  return `solgoal:${safeWallet(walletAddress)}:${key}`;
}

function readValue(key: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    return memoryStore.get(key) ?? null;
  }

  return memoryStore.get(key) ?? null;
}

function writeValue(key: string, value: string) {
  memoryStore.set(key, value);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Memory fallback already has the value.
  }
}

function removeValue(key: string) {
  memoryStore.delete(key);
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures in the MVP.
  }
}

function readJson<T>(key: string, fallback: T): T {
  const raw = readValue(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getPicks(walletAddress: string): UserPick[] {
  return readJson<UserPick[]>(keyFor(walletAddress, "picks"), []);
}

export function savePick(walletAddress: string, pick: UserPick) {
  const picks = getPicks(walletAddress);
  writeValue(keyFor(walletAddress, "picks"), JSON.stringify([pick, ...picks]));
}

export function getDismissedCardIds(walletAddress: string): string[] {
  return readJson<string[]>(keyFor(walletAddress, "dismissed-cards"), []);
}

export function saveDismissedCardId(walletAddress: string, cardId: string) {
  const ids = new Set(getDismissedCardIds(walletAddress));
  ids.add(cardId);
  writeValue(keyFor(walletAddress, "dismissed-cards"), JSON.stringify(Array.from(ids).slice(-300)));
}

export function clearUserData(walletAddress: string) {
  removeValue(keyFor(walletAddress, "picks"));
  removeValue(keyFor(walletAddress, "dismissed-cards"));
}
