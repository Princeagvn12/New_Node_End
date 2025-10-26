import { confirm } from '../plugins/confirmPlugin'

// Simple wrapper to use confirm in components
export function useConfirmDialog() {
  return { confirm }
}