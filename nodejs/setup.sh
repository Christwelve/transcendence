#!/bin/sh
set -e

npm install --legacy-peer-deps
exec node src/app.js
