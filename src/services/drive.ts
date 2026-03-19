import type { DriveBackup } from '../types'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'
const DRIVE_FILE_NAME = 'fintrack-data.json'

function ensureDriveOk(res: Response) {
  if (!res.ok) throw new Error(`Drive request failed with ${res.status}`)
  return res
}

export function getDriveScope() {
  return DRIVE_SCOPE
}

export async function getOrCreateDriveFile(token: string) {
  const search = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(`name="${DRIVE_FILE_NAME}"`)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then(ensureDriveOk)

  const data = (await search.json()) as { files?: Array<{ id: string }> }
  if (data.files?.length) return data.files[0].id

  const create = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DRIVE_FILE_NAME, parents: ['appDataFolder'] }),
  }).then(ensureDriveOk)

  const file = (await create.json()) as { id: string }
  return file.id
}

export async function uploadToDrive(token: string, fileId: string, data: DriveBackup) {
  await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(ensureDriveOk)
}

export async function downloadFromDrive(token: string, fileId: string) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(ensureDriveOk)
  return (await res.json()) as DriveBackup
}

export async function deleteDriveFile(token: string, fileId: string) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).then(ensureDriveOk)
}
