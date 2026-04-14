@echo off
setlocal
set "NODE_HOME=%~dp0..\QuantityMeasurementApp\.tools\node-v24.14.1-win-x64"

if not exist "%NODE_HOME%\npm.cmd" (
  echo Node/npm not found at "%NODE_HOME%".
  echo Install Node.js globally, or keep the local toolchain at "..\QuantityMeasurementApp\.tools".
  exit /b 1
)

set "PATH=%NODE_HOME%;%PATH%"
"%NODE_HOME%\npm.cmd" %*