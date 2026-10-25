import { describe, it, expect } from 'vitest'
import { loadSyncSettings, saveSyncSettings } from './sync'

describe('sync settings', () => {
  it('saves and loads valid settings', () => {
    saveSyncSettings({ shopId: 'ada-shop', pin: '1234' })
    expect(loadSyncSettings()).toEqual({ shopId: 'ada-shop', pin: '1234' })
    saveSyncSettings(null)
    expect(loadSyncSettings()).toBe(null)
  })
  it('rejects incomplete settings', () => {
    localStorage.setItem('mr-pos-sync', JSON.stringify({ shopId: 'x' }))
    expect(loadSyncSettings()).toBe(null)
  })
})
