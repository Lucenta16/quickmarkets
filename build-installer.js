const builder = require('electron-builder');
const Platform = builder.Platform;

// Promise is returned
builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.quickmarkets.app',
    productName: 'QuickMarkets',
    win: {
      target: ['nsis'],
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true
    },
    directories: {
      output: 'release-builds'
    }
  }
})
  .then(() => {
    console.log('Windows installer built successfully!');
  })
  .catch((error) => {
    console.error('Error building Windows installer:', error);
  });
