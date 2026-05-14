/**
 * Electron Preload Script - PixelWallpaper AI
 *
 * Exposes a safe bridge between the main process and renderer process
 * using Electron's contextBridge API.
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invoke an IPC handler in the main process
   * @param {string} channel - The IPC channel name
   * @param {*} args - Arguments to pass to the handler
   * @returns {Promise<*>} - The result from the handler
   */
  invoke: (channel, args) => {
    // Whitelist of allowed IPC channels for security
    const allowedChannels = [
      'download-and-save-wallpaper',
      'save-uploaded-wallpaper',
      'set-desktop-wallpaper',
      'save-wallpaper-dialog',
      'get-wallpaper-directory',
      'get-wallpaper-dir',
      'list-wallpapers',
      'delete-wallpaper',
      'get-app-data-dir',
      'generate-random-wallpaper',
    ]

    if (allowedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, args)
    }

    return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`))
  },

  /**
   * Listen for wallpaper-changed events from the main process
   * @param {function} callback - Callback function that receives the wallpaper path
   * @returns {function} - Cleanup function to remove the listener
   */
  onWallpaperChanged: (callback) => {
    const handler = (_event, wallpaperPath) => {
      callback(wallpaperPath)
    }
    ipcRenderer.on('wallpaper-changed', handler)

    // Return a cleanup function
    return () => {
      ipcRenderer.removeListener('wallpaper-changed', handler)
    }
  },
})
