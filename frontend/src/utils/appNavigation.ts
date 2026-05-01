export const APP_NAVIGATE_EVENT = "writers-studio:navigate";

export interface AppNavigationDetail {
  view: string;
  payload?: Record<string, unknown>;
  token: number;
}

export interface EditorNavigationPayload {
  storyId?: string;
  chapterId?: string;
}

export const navigateToView = (
  view: string,
  payload?: Record<string, unknown>,
): void => {
  const detail: AppNavigationDetail = {
    view,
    payload,
    token: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<AppNavigationDetail>(APP_NAVIGATE_EVENT, { detail }),
  );
};
