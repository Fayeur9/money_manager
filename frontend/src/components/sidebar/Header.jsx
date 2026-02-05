import clsx from 'clsx'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'

function HeaderSidebar({ isOpen, setIsOpen }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-border">
      {/* Logo / Titre */}
      <h2
        className={clsx(
          'text-xl font-semibold whitespace-nowrap',
          'bg-gradient-to-br from-neon-cyan to-neon-purple bg-clip-text text-transparent',
          !isOpen && 'hidden'
        )}
      >
        GesCompte
      </h2>

      {/* Bouton toggle */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={clsx(
          'p-2 rounded-lg border border-border bg-bg-card cursor-pointer',
          'flex items-center justify-center',
          'transition-all duration-300',
          'hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]'
        )}
      >
        {isOpen ? (
          <MenuOpenIcon className="text-neon-cyan text-xl" />
        ) : (
          <MenuIcon className="text-neon-cyan text-xl" />
        )}
      </button>
    </div>
  )
}

export default HeaderSidebar
