#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const binDir = path.join(__dirname, 'bin');
const packageJsonPath = path.join(__dirname, 'package.json');

try {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = pkg.version;

  const platform = process.platform;
  const arch = process.arch;

  let assetName = '';
  let isWindows = platform === 'win32';

  if (platform === 'darwin') {
    if (arch === 'x64') assetName = 'testify_darwin_amd64.tar.gz';
    else if (arch === 'arm64') assetName = 'testify_darwin_arm64.tar.gz';
  } else if (platform === 'linux') {
    if (arch === 'x64') assetName = 'testify_linux_amd64.tar.gz';
    else if (arch === 'arm64') assetName = 'testify_linux_arm64.tar.gz';
  } else if (platform === 'win32') {
    if (arch === 'x64') assetName = 'testify_windows_amd64.zip';
    else if (arch === 'arm64') assetName = 'testify_windows_arm64.zip';
  }

  if (!assetName) {
    console.error(`ERROR: Unsupported platform/architecture: ${platform}/${arch}`);
    process.exit(1);
  }

  const url = `https://github.com/nityam123-pixle/testify-cli/releases/download/v${version}/${assetName}`;
  const archivePath = path.join(binDir, assetName);

  function download(url, dest) {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          download(response.headers.location, dest).then(resolve).catch(reject);
        } else if (response.statusCode === 200) {
          const file = fs.createWriteStream(dest);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
          file.on('error', (err) => {
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            reject(err);
          });
        } else {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  download(url, archivePath).then(() => {
    try {
      if (isWindows) {
        execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${binDir}' -Force"`);
      } else {
        execSync(`tar -xzf "${archivePath}" -C "${binDir}"`);
      }
      
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }

      if (!isWindows) {
        const binPath = path.join(binDir, 'testify');
        if (fs.existsSync(binPath)) {
          fs.chmodSync(binPath, 0o755);
        }
      }

      console.log(`✓ Testify v${version} installed`);
    } catch (err) {
      console.error(`ERROR: Extraction failed: ${err.message}`);
      process.exit(1);
    }
  }).catch((err) => {
    console.error(`ERROR: Download failed: ${err.message}`);
    process.exit(1);
  });

} catch (err) {
  console.error(`ERROR: Installation failed: ${err.message}`);
  process.exit(1);
}
