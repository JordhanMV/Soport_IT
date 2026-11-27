import { app, ipcMain, safeStorage } from 'electron'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SqliteInventoryRepository } from '../../database/repository/sqlite-inventory-repository'
import type { SyncStatus } from '../../src/shared/types'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

export function registerSupabaseHandlers(repository: SqliteInventoryRepository): void {
  let status: SyncStatus = { state: 'idle' }
  let client: SupabaseClient | null = null

  if (supabaseUrl && publishableKey) {
    client = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }

  const sessionPath = join(app.getPath('userData'), 'supabase-session.enc')

  function publish(next: SyncStatus): SyncStatus {
    status = next
    return status
  }

  ipcMain.handle('supabase:status', () => status)

  ipcMain.handle('supabase:sign-in', async (_event, email: string, password: string) => {
    if (!client) return publish({ state: 'error', message: 'Falta configurar la conexión con Supabase.' })
    const result = await client.auth.signInWithPassword({ email, password })
    if (result.error) return publish({ state: 'error', message: result.error.message })
    if (!result.data.session) return publish({ state: 'error', message: 'No se pudo iniciar la sesión.' })
    persistSession(result.data.session.access_token, result.data.session.refresh_token)
    return publish({ state: 'signed-in', email: result.data.user?.email ?? email })
  })

  ipcMain.handle('supabase:sign-up', async (_event, email: string, password: string) => {
    if (!client) return publish({ state: 'error', message: 'Falta configurar la conexión con Supabase.' })
    const result = await client.auth.signUp({ email, password })
    if (result.error) return publish({ state: 'error', message: result.error.message })
    if (!result.data.session) return publish({
      state: 'signed-out',
      message: 'Cuenta creada. Confirma el correo y después inicia sesión.',
    })
    persistSession(result.data.session.access_token, result.data.session.refresh_token)
    return publish({ state: 'signed-in', email: result.data.user?.email ?? email })
  })

  ipcMain.handle('supabase:sign-out', async () => {
    if (client) await client.auth.signOut()
    if (existsSync(sessionPath)) unlinkSync(sessionPath)
    return publish({ state: 'signed-out' })
  })

  ipcMain.handle('supabase:sync', async () => {
    if (!client) return publish({ state: 'error', message: 'Falta configurar la conexión con Supabase.' })
    const session = restoreSession()
    if (!session) return publish({ state: 'signed-out', message: 'Inicia sesión para sincronizar.' })
    const { error: sessionError } = await client.auth.setSession(session)
    if (sessionError) return publish({ state: 'error', message: sessionError.message })
    const result = await synchronize(client, repository)
    if (result.state === 'error') {
      const { data } = await client.auth.getUser()
      return publish({ ...result, email: data.user?.email ?? undefined })
    }
    return publish(result)
  })

  restoreOnStart()

  async function restoreOnStart(): Promise<void> {
    const session = restoreSession()
    if (!client || !session) {
      status = { state: 'signed-out' }
      return
    }
    const { data, error } = await client.auth.setSession(session)
    status = error
      ? { state: 'signed-out', message: error.message }
      : { state: 'signed-in', email: data.user?.email ?? undefined }
  }

  function persistSession(accessToken: string, refreshToken: string): void {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('El cifrado seguro no está disponible.')
    const encrypted = safeStorage.encryptString(JSON.stringify({ accessToken, refreshToken }))
    writeFileSync(sessionPath, encrypted)
  }

  function restoreSession(): { access_token: string; refresh_token: string } | null {
    if (!existsSync(sessionPath) || !safeStorage.isEncryptionAvailable()) return null
    try {
      const value = JSON.parse(safeStorage.decryptString(readFileSync(sessionPath)).toString()) as {
        accessToken: string
        refreshToken: string
      }
      return { access_token: value.accessToken, refresh_token: value.refreshToken }
    } catch {
      return null
    }
  }
}

async function synchronize(client: SupabaseClient, repository: SqliteInventoryRepository): Promise<SyncStatus> {
  const snapshot = repository.syncSnapshot()
  const { data: userData, error: userError } = await client.auth.getUser()
  if (userError || !userData.user) return { state: 'signed-out', message: 'La sesión ya no es válida.' }
  const ownerId = userData.user.id

  try {
    await processDeletes(client, repository)
    await pushTable(client, 'areas', ownerId, snapshot.areas, (row) => ({
      id: row.syncId, owner_id: ownerId, name: row.name,
      created_at: row.createdAt, updated_at: row.syncUpdatedAt, deleted_at: null,
    }))
    await pushTable(client, 'people', ownerId, snapshot.people, (row) => ({
      id: row.syncId, owner_id: ownerId, name: row.name, email: row.email,
      phone: row.phone, area_id: row.areaSyncId || null, status: row.status,
      created_at: row.createdAt, updated_at: row.syncUpdatedAt, deleted_at: null,
    }))
    await pushTable(client, 'equipment', ownerId, snapshot.equipment, (row) => ({
      id: row.syncId, owner_id: ownerId, asset_tag: row.assetTag, person_id: row.personSyncId || null,
      device_type: row.deviceType, laptop_brand: row.laptopBrand, processor: row.processor,
      memory_gb: row.memoryGb, graphics_card: row.graphicsCard, disk_capacity_gb: row.diskCapacityGb,
      disk_type: row.diskType, operating_system: row.operatingSystem,
      maintenance_done: Boolean(row.maintenanceDone), last_maintenance_date: row.lastMaintenanceDate,
      status: row.status, notes: row.notes, created_at: row.createdAt,
      updated_at: row.syncUpdatedAt, deleted_at: null,
    }))
    await pushTable(client, 'components', ownerId, snapshot.components, (row) => ({
      id: row.syncId, owner_id: ownerId, name: row.name, category: row.category,
      brand: row.brand, model: row.model, serial_number: row.serialNumber,
      equipment_id: row.equipmentSyncId || null, created_at: row.createdAt,
      updated_at: row.syncUpdatedAt, deleted_at: null,
    }))
    await pushTable(client, 'pending_notes', ownerId, snapshot.pendingNotes, (row) => ({
      id: row.syncId, owner_id: ownerId, title: row.title, content: row.content,
      completed: Boolean(row.completed), created_at: row.createdAt,
      updated_at: row.syncUpdatedAt, deleted_at: null,
    }))

    await pullTable(client, 'areas', snapshot.areas, 'areas', repository)
    await pullTable(client, 'people', snapshot.people, 'people', repository)
    await pullTable(client, 'equipment', snapshot.equipment, 'equipment', repository)
    await pullTable(client, 'components', snapshot.components, 'components', repository)
    await pullTable(client, 'pending_notes', snapshot.pendingNotes, 'pendingNotes', repository)

    return { state: 'synced', email: userData.user.email ?? undefined, synchronizedAt: new Date().toISOString() }
  } catch (error) {
    return { state: 'error', message: error instanceof Error ? error.message : 'La sincronización falló.' }
  }
}

async function processDeletes(client: SupabaseClient, repository: SqliteInventoryRepository): Promise<void> {
  const queue = repository.syncQueue()
  if (!queue.length) return
  const cleared: number[] = []
  for (const item of queue) {
    const table = item.entityType === 'pending_notes' ? 'pending_notes' : item.entityType
    const { error } = await client.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', item.syncId)
    if (!error) cleared.push(item.id)
  }
  repository.clearSyncQueue(cleared)
}

type SyncRow = Record<string, any>

async function pushTable(
  client: SupabaseClient,
  table: string,
  ownerId: string,
  rows: SyncRow[],
  map: (row: SyncRow) => SyncRow,
): Promise<void> {
  const { data: remoteRows, error: fetchError } = await client.from(table).select('id,updated_at,deleted_at').eq('owner_id', ownerId)
  if (fetchError) throw fetchError
  const remote = new Map((remoteRows ?? []).map((row) => [row.id, row]))
  const toPush = rows.filter((row) => !row.syncDeleted && (!remote.has(row.syncId) ||
    Date.parse(String(row.syncUpdatedAt)) >= Date.parse(String(remote.get(row.syncId)?.updated_at ?? 0))))
  if (!toPush.length) return
  const { error } = await client.from(table).upsert(toPush.map(map), { onConflict: 'id' })
  if (error) throw error
}

async function pullTable(
  client: SupabaseClient,
  table: string,
  localRows: SyncRow[],
  entityType: 'areas' | 'people' | 'equipment' | 'components' | 'pendingNotes',
  repository: SqliteInventoryRepository,
): Promise<void> {
  const { data: remoteRows, error } = await client.from(table).select('*')
  if (error) throw error
  const local = new Map(localRows.map((row) => [String(row.syncId), String(row.syncUpdatedAt)]))
  const newer = (remoteRows ?? []).filter((row) => {
    const localUpdated = local.get(row.id)
    return !localUpdated || Date.parse(row.updated_at ?? row.created_at) >= Date.parse(localUpdated)
  })
  if (newer.length) repository.mergeRemote(entityType, newer)
}
