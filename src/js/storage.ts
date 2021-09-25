import type { SlackLocalStorageData } from './types/slackLocalStorage';

/** 拡張機能のストレージ */
type CStorage = {
  slack: SlackLocalStorageData;
  workSpaceOptions: {
    [key: string]: Option;
  };
};

/** 拡張機能の設定 */
export type Option = {
  showDeleteButton?: boolean;
};

/** 拡張機能の設定のデフォルト値 */
export const defaultOption = {
  showDeleteButton: true,
} as const;

/**
 * 拡張機能のストレージから値を取得。
 * @param key キー
 * @returns 値
 */
export const get = <K extends keyof CStorage>(key: K): Promise<CStorage[K] | undefined> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (items) => {
      if (!items[key]) {
        resolve(undefined);
      }
      resolve(items[key] as CStorage[K]);
    });
  });
};

/**
 * 拡張機能のストレージに値をセット。
 * @param key キー
 * @param value 値
 */
export const set = <K extends keyof CStorage>(
  key: K,
  value: CStorage[K] | undefined
): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
};
