#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const binName = isWindows ? 'testify.exe' : 'testify';
const binPath = path.join(__dirname, binName);

const result = spawnSync(binPath, process.argv.slice(2), {
  stdio: 'inherit',
});

process.exit(result.status === null ? 1 : result.status);
