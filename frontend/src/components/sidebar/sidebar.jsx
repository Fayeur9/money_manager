import clsx from 'clsx'
import HeaderSidebar from './Header'
import BodySidebar from './Body'
import FooterSidebar from './Footer'

function SideBar({ sidebar_open, setSidebarOpen, tab_pages }) {
  return (
    <aside
      className={clsx(
        'sticky top-0 h-screen flex flex-col justify-between shrink-0 overflow-hidden',
        'border-r border-border transition-all duration-300',
        sidebar_open ? 'w-[280px]' : 'w-[75px]'
      )}
      style={{
        background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)'
      }}
    >
      <HeaderSidebar isOpen={sidebar_open} setIsOpen={setSidebarOpen} />
      <BodySidebar pages={tab_pages} isOpen={sidebar_open} />
      <FooterSidebar isOpen={sidebar_open} />
    </aside>
  )
}

export default SideBar
