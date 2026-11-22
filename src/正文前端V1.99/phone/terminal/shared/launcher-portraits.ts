const portraitBase = 'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/全身立绘/';

export const PHONE_LAUNCHER_PORTRAITS = {
  aqua: { name: '阿洛娜', url: new URL('阿洛娜_Q版立绘_v1.png', portraitBase).href },
  midnight: { name: '普拉娜', url: new URL('普拉娜_Q版立绘_v1.png', portraitBase).href },
} as const;

export type PhoneLauncherTheme = keyof typeof PHONE_LAUNCHER_PORTRAITS;
