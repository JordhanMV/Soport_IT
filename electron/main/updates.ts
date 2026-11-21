import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { UpdateStatus } from '../../src/shared/types'

export function registerUpdateHandlers(): void {
  let status: UpdateStatus = { state: 'idle' }

  const publish = (nextStatus: UpdateStatus) => {
    status = nextStatus
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('updates:status', status)
    }
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => publish({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () => publish({ state: 'not-available' }))
  autoUpdater.on('download-progress', (progress) => publish({ state: 'downloading', percent: progress.percent }))
  autoUpdater.on('update-downloaded', (info) => publish({ state: 'downloaded', version: info.version }))
  autoUpdater.on('error', (error) => publish({
    state: 'error',
    message: error.message || 'No se pudo consultar o descargar la actualización.',
  }))

  ipcMain.handle('updates:check', async () => {
    if (!app.isPackaged) return
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      publish({ state: 'error', message: messageOf(error) })
    }
  })

  ipcMain.handle('updates:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      publish({ state: 'error', message: messageOf(error) })
    }
  })

  ipcMain.handle('updates:install', () => {
    if (app.isPackaged) autoUpdater.quitAndInstall()
  })

  ipcMain.handle('updates:status', () => status)
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la actualización.'
}
