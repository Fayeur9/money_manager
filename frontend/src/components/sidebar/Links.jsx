import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'

function SidebarLink({ icon, text, link, isOpen }) {
  const location = useLocation()
  const isActive = location.pathname === link || (link === '/' && location.pathname === '/home')

  // Filtres CSS pour colorer les icônes
  const iconFilterInactive = 'brightness(0) saturate(100%) invert(70%)'
  const iconFilterActive = 'brightness(0) saturate(100%) invert(85%) sepia(50%) saturate(1000%) hue-rotate(140deg)'

  return (
    <Link
      to={link}
      className={clsx(
        'flex items-center gap-3 mb-2 rounded-[10px] no-underline',
        'border border-transparent transition-all duration-300',
        isOpen ? 'px-4 py-3' : 'p-3 justify-center',
        isActive
          ? 'text-neon-cyan bg-neon-cyan/10 border-white'
          : 'text-text-secondary bg-transparent hover:text-neon-cyan hover:bg-neon-cyan/5 hover:border-neon-cyan/30 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)]'
      )}
    >
      <img
        src={`/icons/${icon}.png`}
        alt={text}
        style={{
          width: '24px',
          height: '24px',
          minWidth: '24px',
          minHeight: '24px',
          maxWidth: '24px',
          maxHeight: '24px',
          flexShrink: 0,
          objectFit: 'contain',
          filter: isActive ? iconFilterActive : iconFilterInactive,
          transition: 'all 0.3s'
        }}
      />
      {isOpen && (
        <span className="whitespace-nowrap overflow-hidden">{text}</span>
      )}
    </Link>
  )
}

export default SidebarLink
