import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Menu, MenuItem } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AvatarUser from '../AvatarUser'

function FooterSidebar({ isOpen }) {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null

  const handleClick = (e) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/auth')
    handleClose()
  }

  const handleProfile = () => {
    navigate('/profil')
    handleClose()
  }

  return (
    <div className={clsx('border-t border-border', isOpen ? 'p-4' : 'px-2 py-4')}>
      <div
        onClick={handleClick}
        className={clsx(
          'flex items-center gap-3 rounded-[10px] cursor-pointer',
          'bg-bg-card border border-border',
          'transition-all duration-300',
          'hover:border-neon-cyan hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]',
          isOpen ? 'p-3' : 'p-3 justify-center'
        )}
      >
        <AvatarUser user={user} size="small" />
        {isOpen && (
          <>
            <span className="flex-1 text-text-primary font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {(user?.first_name?.trim() || user?.last_name?.trim())
                ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                : 'Mon profil'}
            </span>
            <MoreVertIcon className="text-text-secondary text-xl shrink-0" />
          </>
        )}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              minWidth: '180px',
              marginBottom: '8px',
              '& .MuiMenuItem-root': {
                color: 'var(--color-text-primary)',
                fontSize: '0.9rem',
                padding: '10px 16px',
                gap: '10px',
                '&:hover': {
                  backgroundColor: 'var(--color-bg-card)',
                },
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleProfile}>
          <PersonIcon fontSize="small" />
          Profil
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: '#f87171 !important' }}>
          <LogoutIcon fontSize="small" />
          Déconnexion
        </MenuItem>
      </Menu>
    </div>
  )
}

export default FooterSidebar
