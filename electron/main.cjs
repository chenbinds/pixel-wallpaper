/**
 * Electron Main Process - PixelWallpaper AI
 *
 * Main process entry point for the Electron application.
 * Handles window management, system tray, and IPC for wallpaper operations.
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const fsPromises = require('fs/promises')
const { exec, execFile } = require('child_process')
const https = require('https')
const http = require('http')

// ============================================
// Constants
// ============================================

const VITE_DEV_SERVER_URL = 'http://localhost:1420'
const APP_TITLE = 'PixelWallpaper AI'
const WINDOW_WIDTH = 1200
const WINDOW_HEIGHT = 800

// ============================================
// Global references
// ============================================

let mainWindow = null
let tray = null

// ============================================
// Directory helpers
// ============================================

/**
 * Get the wallpapers directory path
 */
function getWallpapersDir() {
  return path.join(app.getPath('home'), 'PixelWallpaper', 'wallpapers')
}

/**
 * Get the app data directory path
 */
function getAppDataDir() {
  return path.join(app.getPath('home'), 'PixelWallpaper')
}

/**
 * Ensure directories exist
 */
async function ensureDirectories() {
  const wallpapersDir = getWallpapersDir()
  const appDataDir = getAppDataDir()
  try {
    await fsPromises.mkdir(appDataDir, { recursive: true })
    await fsPromises.mkdir(wallpapersDir, { recursive: true })
  } catch (err) {
    console.error('Failed to create directories:', err)
  }
}

// ============================================
// Image download helper
// ============================================

/**
 * Download an image from a URL and save it to a file
 * @param {string} url - The image URL
 * @param {string} destPath - Destination file path
 * @returns {Promise<string>} - The saved file path
 */
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close()
        fs.unlink(destPath, () => {})
        downloadImage(response.headers.location, destPath).then(resolve).catch(reject)
        return
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlink(destPath, () => {})
        reject(new Error(`Download failed with status code: ${response.statusCode}`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(destPath)
      })
    }).on('error', (err) => {
      file.close()
      fs.unlink(destPath, () => {})
      reject(err)
    })
  })
}

// ============================================
// Wallpaper setting helper (Windows)
// ============================================

/**
 * Set the desktop wallpaper on Windows using registry and SystemParametersInfo
 * @param {string} imagePath - Absolute path to the wallpaper image
 * @returns {Promise<void>}
 */
function setDesktopWallpaperWindows(imagePath) {
  return new Promise((resolve, reject) => {
    // Normalize path for Windows (forward slashes to backslashes)
    const normalizedPath = imagePath.replace(/\//g, '\\')

    const commands = [
      `reg add "HKCU\\Control Panel\\Desktop" /v WallpaperStyle /t REG_SZ /d 0 /f`,
      `reg add "HKCU\\Control Panel\\Desktop" /v TileWallpaper /t REG_SZ /d 0 /f`,
      `reg add "HKCU\\Control Panel\\Desktop" /v Wallpaper /t REG_SZ /d "${normalizedPath}" /f`,
      `RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters`,
    ]

    const fullCommand = commands.join(' && ')
    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to set wallpaper:', error)
        reject(new Error(`Failed to set wallpaper: ${error.message}`))
        return
      }
      resolve()
    })
  })
}

/**
 * Set desktop wallpaper (platform-aware)
 * @param {string} imagePath - Absolute path to the wallpaper image
 * @returns {Promise<void>}
 */
async function setDesktopWallpaper(imagePath) {
  const platform = process.platform
  if (platform === 'win32') {
    await setDesktopWallpaperWindows(imagePath)
  } else if (platform === 'darwin') {
    // macOS: use osascript to set wallpaper via System Events
    return new Promise((resolve, reject) => {
      const script = `osascript -e 'tell application "System Events" to set picture of every desktop to "${imagePath}"'`
      exec(script, (error) => {
        if (error) {
          reject(new Error(`Failed to set wallpaper on macOS: ${error.message}`))
          return
        }
        resolve()
      })
    })
  } else {
    // Linux: use gsettings or feh or similar
    return new Promise((resolve, reject) => {
      exec('gsettings get org.gnome.desktop.background picture-uri', (error) => {
        if (!error) {
          const uri = `file://${imagePath}`
          const cmd = `gsettings set org.gnome.desktop.background picture-uri "${uri}" && gsettings set org.gnome.desktop.background picture-uri-dark "${uri}"`
          exec(cmd, (err) => {
            if (err) {
              reject(new Error(`Failed to set wallpaper on Linux: ${err.message}`))
              return
            }
            resolve()
          })
        } else {
          reject(new Error('Setting wallpaper is not supported on this platform'))
        }
      })
    })
  }
}

// ============================================
// Random wallpaper helper
// ============================================

/**
 * Pick a random image from the wallpapers directory and set it as wallpaper
 * @returns {Promise<string>} - The path of the selected wallpaper
 */
async function generateRandomWallpaper() {
  const wallpapersDir = getWallpapersDir()
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp']

  try {
    const files = await fsPromises.readdir(wallpapersDir)
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase()
      return imageExtensions.includes(ext)
    })

    if (imageFiles.length === 0) {
      throw new Error('No wallpapers found in the directory')
    }

    const randomIndex = Math.floor(Math.random() * imageFiles.length)
    const selectedFile = imageFiles[randomIndex]
    const selectedPath = path.join(wallpapersDir, selectedFile)

    await setDesktopWallpaper(selectedPath)

    // Notify renderer about wallpaper change
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('wallpaper-changed', selectedPath)
    }

    return selectedPath
  } catch (err) {
    console.error('Failed to generate random wallpaper:', err)
    throw err
  }
}

// ============================================
// Window creation
// ============================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    title: APP_TITLE,
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })
}

// ============================================
// System tray
// ============================================

function createTray() {
  // Use a simple icon path (will work even if icon doesn't exist)
  const iconPath = path.join(__dirname, '..', 'public', 'favicon.ico')

  try {
    tray = new Tray(iconPath)
  } catch (err) {
    console.warn('Could not create tray icon, using empty icon:', err.message)
    // Create tray without a custom icon (Electron will use default)
    tray = new Tray(path.join(__dirname, 'preload.js')) // fallback
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createWindow()
        }
      },
    },
    {
      label: '随机壁纸',
      click: async () => {
        try {
          const wallpaperPath = await generateRandomWallpaper()
          if (!Notification.isSupported()) {
            console.log('Random wallpaper set to:', wallpaperPath)
            return
          }
          new Notification({
            title: '壁纸已更换',
            body: `已切换到: ${path.basename(wallpaperPath)}`,
          }).show()
        } catch (err) {
          console.error('Failed to set random wallpaper from tray:', err)
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip('PixelWallpaper AI')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })
}

// ============================================
// IPC Handlers
// ============================================

function registerIpcHandlers() {
  /**
   * Download an image from URL and save to wallpapers directory
   */
  ipcMain.handle('download-and-save-wallpaper', async (_event, { imageUrl, filename }) => {
    try {
      await ensureDirectories()
      const wallpapersDir = getWallpapersDir()
      const destPath = path.join(wallpapersDir, filename)

      // Safety check: ensure the destination is within the wallpapers directory
      const resolvedDest = path.resolve(destPath)
      const resolvedDir = path.resolve(wallpapersDir)
      if (!resolvedDest.startsWith(resolvedDir)) {
        throw new Error('Invalid destination path: path traversal detected')
      }

      await downloadImage(imageUrl, destPath)
      return destPath
    } catch (err) {
      console.error('download-and-save-wallpaper failed:', err)
      throw err
    }
  })

  /**
   * Save a base64-encoded uploaded image to wallpapers directory
   */
  ipcMain.handle('save-uploaded-wallpaper', async (_event, { fileData, filename, description, originalAuthor }) => {
    try {
      await ensureDirectories()
      const wallpapersDir = getWallpapersDir()
      const destPath = path.join(wallpapersDir, filename)

      // Safety check: ensure the destination is within the wallpapers directory
      const resolvedDest = path.resolve(destPath)
      const resolvedDir = path.resolve(wallpapersDir)
      if (!resolvedDest.startsWith(resolvedDir)) {
        throw new Error('Invalid destination path: path traversal detected')
      }

      // Strip data URI prefix if present
      let base64Data = fileData
      if (base64Data.startsWith('data:')) {
        const commaIndex = base64Data.indexOf(',')
        if (commaIndex !== -1) {
          base64Data = base64Data.substring(commaIndex + 1)
        }
      }

      const buffer = Buffer.from(base64Data, 'base64')
      await fsPromises.writeFile(destPath, buffer)

      // Save metadata alongside the image
      const metadataPath = path.join(wallpapersDir, `${filename}.meta.json`)
      const metadata = {
        description: description || '',
        originalAuthor: originalAuthor || '',
        savedAt: new Date().toISOString(),
      }
      await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

      return destPath
    } catch (err) {
      console.error('save-uploaded-wallpaper failed:', err)
      throw err
    }
  })

  /**
   * Set the desktop wallpaper
   */
  ipcMain.handle('set-desktop-wallpaper', async (_event, { imagePath }) => {
    try {
      // Safety check: verify the file exists
      await fsPromises.access(imagePath, fs.constants.R_OK)

      await setDesktopWallpaper(imagePath)

      // Notify renderer about wallpaper change
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('wallpaper-changed', imagePath)
      }
    } catch (err) {
      console.error('set-desktop-wallpaper failed:', err)
      throw err
    }
  })

  /**
   * Get the wallpapers directory path
   */
  ipcMain.handle('get-wallpaper-directory', async () => {
    await ensureDirectories()
    return getWallpapersDir()
  })

  /**
   * Get the wallpaper directory (alias)
   */
  ipcMain.handle('get-wallpaper-dir', async () => {
    await ensureDirectories()
    return getWallpapersDir()
  })

  /**
   * List all wallpapers in the wallpapers directory
   */
  ipcMain.handle('list-wallpapers', async () => {
    try {
      await ensureDirectories()
      const wallpapersDir = getWallpapersDir()
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp']

      const files = await fsPromises.readdir(wallpapersDir)
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return imageExtensions.includes(ext)
      })

      const wallpaperList = []
      for (const file of imageFiles) {
        const filePath = path.join(wallpapersDir, file)
        try {
          const stats = await fsPromises.stat(filePath)
          wallpaperList.push({
            filename: file,
            filepath: filePath,
            size: stats.size,
            modified_time: stats.mtime.toISOString().replace('T', ' ').substring(0, 19),
          })
        } catch (err) {
          console.warn(`Failed to stat file ${file}:`, err)
        }
      }

      // Sort by modified time, newest first
      wallpaperList.sort((a, b) => b.modified_time.localeCompare(a.modified_time))

      return wallpaperList
    } catch (err) {
      console.error('list-wallpapers failed:', err)
      throw err
    }
  })

  /**
   * Delete a wallpaper file
   */
  ipcMain.handle('delete-wallpaper', async (_event, { filePath }) => {
    try {
      const resolvedPath = path.resolve(filePath)
      const resolvedDir = path.resolve(getWallpapersDir())

      // Safety check: ensure the file is within the wallpapers directory
      if (!resolvedPath.startsWith(resolvedDir)) {
        throw new Error('Invalid file path: path traversal detected')
      }

      // Additional safety: ensure the file is an image
      const ext = path.extname(resolvedPath).toLowerCase()
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp']
      if (!allowedExtensions.includes(ext)) {
        throw new Error('Invalid file type: only image files can be deleted')
      }

      await fsPromises.unlink(resolvedPath)

      // Also delete metadata file if it exists
      const metaPath = `${resolvedPath}.meta.json`
      try {
        await fsPromises.unlink(metaPath)
      } catch (err) {
        // Metadata file may not exist, ignore
      }
    } catch (err) {
      console.error('delete-wallpaper failed:', err)
      throw err
    }
  })

  /**
   * Get the app data directory
   */
  ipcMain.handle('get-app-data-dir', async () => {
    await ensureDirectories()
    return getAppDataDir()
  })

  /**
   * Generate a random wallpaper and set it
   */
  ipcMain.handle('generate-random-wallpaper', async () => {
    return generateRandomWallpaper()
  })
}

// ============================================
// App lifecycle
// ============================================

app.whenReady().then(async () => {
  await ensureDirectories()
  createWindow()
  createTray()
  registerIpcHandlers()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Prevent the app from quitting when all windows are closed (keep tray alive)
let isQuitting = false
app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  // On macOS, keep the app running for the tray
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running for tray but don't quit
    // The user can quit from the tray menu
  }
})

// Handle second instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}
