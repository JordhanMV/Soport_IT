import { app, BrowserWindow, ipcMain, safeStorage } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'
import { registerInventoryHandlers } from './inventory-ipc'
import { registerUpdateHandlers } from './updates'

let repository: SqliteInventoryRepository

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: '#F5F7FA',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  const databaseDirectory = join(app.getPath('userData'), 'database')
  mkdirSync(databaseDirectory, { recursive: true })
  repository = await SqliteInventoryRepository.open(join(databaseDirectory, 'inventario.sqlite'))
  registerInventoryHandlers(ipcMain, repository, safeStorage)
  registerUpdateHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((error: unknown) => {
  console.error('No se pudo iniciar el inventario local:', error)
  app.quit()
})

app.on('before-quit', () => repository?.close())
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
