'use client'

import { AlertTriangle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: 'confirm' | 'alert'
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const iconColors = {
    danger: 'bg-red-100 text-red-600',
    primary: 'bg-blue-100 text-blue-600',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[confirmVariant]}`}
          >
            {type === 'confirm' ? (
              <AlertTriangle size={20} />
            ) : (
              <Info size={20} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          {type === 'alert' ? (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition cursor-pointer"
            >
              OK
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onConfirm?.()
                  onClose()
                }}
                className={`px-4 py-2 font-medium rounded-lg transition text-white cursor-pointer ${
                  confirmVariant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
