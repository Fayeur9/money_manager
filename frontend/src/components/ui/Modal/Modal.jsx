import { useEffect } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import clsx from 'clsx'

/**
 * Composant Modal générique réutilisable
 * @param {Object} props
 * @param {boolean} props.isOpen - Si la modal est ouverte
 * @param {Function} props.onClose - Callback de fermeture
 * @param {string} props.title - Titre de la modal
 * @param {React.ReactNode} props.children - Contenu de la modal
 * @param {React.ReactNode} props.footer - Footer avec actions
 * @param {string} props.className - Classes additionnelles
 * @param {string} props.size - Taille de la modal (sm, md, lg)
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  size = 'md',
  as: Component = 'div',
  onSubmit
}) {
  // Fermer avec Échap
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Empêcher le scroll du body quand la modal est ouverte
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl'
  }

  return (
    <div
      className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Component
        className={clsx(
          'bg-bg-card border border-border rounded-2xl w-full max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
        onSubmit={Component === 'form' ? (e) => {
          e.preventDefault()
          onSubmit?.(e)
        } : undefined}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border">
          <h3 className="m-0 text-xl text-text-primary font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-transparent border-none rounded-lg cursor-pointer text-text-secondary transition-all duration-200 hover:bg-white/10 hover:text-text-primary"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-border">
            {footer}
          </div>
        )}
      </Component>
    </div>
  )
}

export default Modal
