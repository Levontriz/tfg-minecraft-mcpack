@echo off
echo ====================================
echo Copying BP and RP to Minecraft Bedrock
echo ====================================
echo.

REM Source directories
set "SOURCE_DIR=C:\Users\WINDOWS\Desktop\Coding\tfg-minecraft-mcpack"
set "BP_SOURCE=%SOURCE_DIR%\BP"
set "RP_SOURCE=%SOURCE_DIR%\RP"

REM Destination directories
set "MINECRAFT_BASE=C:\Users\WINDOWS\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang"
set "BP_DEST=%MINECRAFT_BASE%\development_behavior_packs\BP"
set "RP_DEST=%MINECRAFT_BASE%\development_resource_packs\RP"

REM Check if source folders exist
if not exist "%BP_SOURCE%" (
    echo ERROR: BP folder not found at %BP_SOURCE%
    pause
    exit /b 1
)

if not exist "%RP_SOURCE%" (
    echo ERROR: RP folder not found at %RP_SOURCE%
    pause
    exit /b 1
)

echo Source BP folder: %BP_SOURCE%
echo Source RP folder: %RP_SOURCE%
echo.
echo Destination BP folder: %BP_DEST%
echo Destination RP folder: %RP_DEST%
echo.

REM Delete existing folders if they exist
if exist "%BP_DEST%" (
    echo Removing existing BP folder...
    rmdir /S /Q "%BP_DEST%"
)

if exist "%RP_DEST%" (
    echo Removing existing RP folder...
    rmdir /S /Q "%RP_DEST%"
)

echo.
echo Copying BP folder...
xcopy "%BP_SOURCE%" "%BP_DEST%\" /E /I /Y
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy BP folder
    pause
    exit /b 1
)

echo Copying RP folder...
xcopy "%RP_SOURCE%" "%RP_DEST%\" /E /I /Y
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy RP folder
    pause
    exit /b 1
)

echo.
echo ====================================
echo Copy completed successfully!
echo ====================================
pause