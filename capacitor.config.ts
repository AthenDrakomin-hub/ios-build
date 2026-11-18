import type { CapacitorConfig } from '@capacitor/cli'

/**
 * iOS 构建壳配置
 *
 * appId 必须与描述文件里的 AppID 一致（com.cd-rail.zhct），否则签名失败。
 * webDir 指向预构建好的 www（本仓库只放构建产物，不含业务源码）。
 */
const config: CapacitorConfig = {
  appId: 'com.cd-rail.zhct',
  appName: '中信金融',
  webDir: 'www',

  server: {
    iosScheme: 'https',
  },

  ios: {
    contentInset: 'always',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#C8102E',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#C8102E',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
    Camera: {
      webUseInput: true,
    },
  },
}

export default config
