import { useContext } from 'react'
import { ToastContext } from '../components/toast/toast-context'

/**
 * Access the toast API. Typical transaction flow:
 *
 *   const toast = useToast()
 *   const id = toast.pending({ title: 'Locking funds…' })
 *   try {
 *     const hash = await lockFunds()
 *     toast.update(id, 'success', { title: 'Funds locked', message: hash })
 *   } catch (err) {
 *     toast.update(id, 'error', { title: 'Transaction failed', message: String(err) })
 *   }
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default useToast
