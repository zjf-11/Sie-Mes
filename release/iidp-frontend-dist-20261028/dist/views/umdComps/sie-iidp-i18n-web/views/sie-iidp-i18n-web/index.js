// 本地开发extendView引入 入口
import languageExtend from './language/languageExtend';
import langsOptionsExtend from './languageOptionsExtend/langsOptionsExtend';
import translationManagement from './translationManagement/translationManagement';
import multilingualExtend from './multilingual/multilingualExtend';
// window.techUseMultiLang = true;
export default {
  ...languageExtend,
  ...translationManagement,
  ...langsOptionsExtend,
  ...multilingualExtend
};
