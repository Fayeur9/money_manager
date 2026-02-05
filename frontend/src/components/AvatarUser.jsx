import clsx from 'clsx'
import PersonIcon from '@mui/icons-material/Person'

const sizeConfig = {
  small: {
    container: 'w-8 h-8 text-xs',
    icon: 'text-base'
  },
  medium: {
    container: 'w-10 h-10 text-sm',
    icon: 'text-lg'
  },
  large: {
    container: 'w-24 h-24 text-2xl',
    icon: 'text-5xl'
  }
}

function AvatarUser({ user, size = 'medium' }) {
  const config = sizeConfig[size] || sizeConfig.medium
  const hasInitials = user?.first_name?.trim() || user?.last_name?.trim()

  const baseClasses = clsx(
    'rounded-full flex items-center justify-center font-semibold text-white shrink-0',
    config.container
  )

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt="Avatar"
        className={clsx(baseClasses, 'object-cover')}
      />
    )
  }

  if (hasInitials) {
    return (
      <div
        className={baseClasses}
        style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
      >
        {user?.first_name?.charAt(0).toUpperCase()}
        {user?.last_name?.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div
      className={baseClasses}
      style={{ backgroundColor: user?.avatar_color || '#6366f1' }}
    >
      <PersonIcon className={config.icon} />
    </div>
  )
}

export default AvatarUser
