import clsx from 'clsx'
import SidebarLink from './Links'

function BodySidebar({ pages, isOpen }) {
  return (
    <nav className={clsx('flex-1 overflow-y-auto', isOpen ? 'p-4' : 'px-2 py-4')}>
      {pages.map((page, index) => (
        <SidebarLink
          key={index}
          icon={page.icon}
          text={page.nom}
          link={page.lien}
          isOpen={isOpen}
        />
      ))}
    </nav>
  )
}

export default BodySidebar
