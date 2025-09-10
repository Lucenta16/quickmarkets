const builder = require('electron-builder');
const Platform = builder.Platform;

// Promise is returned
builder.build({
  targets: Platform.WINDOWS.createTarget(),
  config: {
    appId: 'com.quickmarkets.app',
    productName: 'QuickMarkets',
    win: {
      target: ['portable'],
      artifactName: 'QuickMarkets-${version}.exe'
    },
    portable: {
      artifactName: 'QuickMarkets-Portable-${version}.exe'
    },
    directories: {
      output: 'release-builds'
    },
    // Disable code signing to avoid symbolic link issues
    forceCodeSigning: false,
    signingHashAlgorithms: null,
    signDlls: false,
    sign: null,
    // Avoid Mac-specific files that cause symbolic link errors
    files: [
      "**/*",
      "!**/*.{dylib}"
    ],
    asar: true
  }
})
  .then(() => {
    console.log('Windows installer built successfully!');
  })
  .catch((error) => {
    console.error('Error building Windows installer:', error);
  });
