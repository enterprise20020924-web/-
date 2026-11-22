function portrait(name: string, fileName: string, preferRaw = false) {
  const path = ['llm1', '全身立绘', fileName].map(encodeURIComponent).join('/');
  const cdn = `https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/${path}`;
  const raw = `https://raw.githubusercontent.com/enterprise20020924-web/-/main/${path}`;
  return { name, portraitUrl: preferRaw ? raw : cdn, fallbackPortraitUrl: preferRaw ? cdn : raw };
}

export const personalTalentPortraits = {
  shizuya: portrait('小夜月静夜', '小夜月静夜变身透明.png'),
  torako: portrait('江口虎子', '黑皮辣妹插图透明版.png', true),
};
