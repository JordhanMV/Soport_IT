import { app, BrowserWindow, dialog, ipcMain, safeStorage } from 'electron'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'
import { generateInventoryReportHtml } from './inventory-report'
import { registerInventoryHandlers } from './inventory-ipc'
import { registerUpdateHandlers } from './updates'
import { registerSupabaseHandlers } from './supabase-sync'

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
  ipcMain.handle('inventory:export-pdf', async (event) => {
    const saveOptions = {
      title: 'Guardar inventario en PDF',
      defaultPath: 'inventario-equipos-personas.pdf',
      filters: [{ name: 'Documento PDF', extensions: ['pdf'] }],
    }
    const owner = BrowserWindow.fromWebContents(event.sender)
    const result = owner
      ? await dialog.showSaveDialog(owner, saveOptions)
      : await dialog.showSaveDialog(saveOptions)
    if (result.canceled || !result.filePath) return { saved: false }

    const reportWindow = new BrowserWindow({
      show: false,
      webPreferences: { javascript: false, contextIsolation: true, sandbox: true },
    })
    try {
      const html = generateInventoryReportHtml(repository.listPeople(), repository.listEquipment())
      await reportWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      const pdf = await reportWindow.webContents.printToPDF({ pageSize: 'A4', printBackground: true })
      await writeFile(result.filePath, pdf)
      return { saved: true }
    } finally {
      reportWindow.close()
    }
  })
  registerUpdateHandlers()
  registerSupabaseHandlers(repository)
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
