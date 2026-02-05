import clsx from 'clsx'
import LockIcon from '@mui/icons-material/Lock'
import EditIcon from '@mui/icons-material/Edit'

/**
 * Carte de catégorie
 * @param {Object} props
 * @param {Object} props.category - Données de la catégorie
 * @param {Function} props.onClick - Callback au clic (catégories custom)
 */
function CategoryCard({ category, onClick }) {
  const isDefault = Boolean(category.is_default)

  return (
    <div
      className={clsx(
        'relative flex flex-col items-center gap-2.5 p-4 px-2 rounded-xl bg-bg-secondary border border-border transition-all duration-200',
        'hover:border-neon-cyan/30 hover:bg-neon-cyan/5',
        isDefault && 'opacity-70',
        !isDefault && [
          'cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-black/40 hover:border-neon-cyan'
        ]
      )}
      onClick={() => !isDefault && onClick?.(category)}
    >
      {/* Icône édition au hover */}
      {!isDefault && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-neon-cyan text-bg-primary flex items-center justify-center opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 category-edit-icon">
          <EditIcon style={{ fontSize: 14 }} />
        </div>
      )}

      {/* Icône catégorie */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: category.color || '#6b7280' }}
      >
        <img
          src={category.icon || '/default/icons/dots.png'}
          alt=""
          className="w-6 h-6 object-contain"
        />
      </div>

      {/* Infos */}
      <div className="flex flex-col items-center gap-0.5 w-full">
        <span className="text-xs font-medium text-text-primary text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
          {category.name}
        </span>
        {isDefault && (
          <span className="inline-flex items-center gap-0.5 text-[0.6rem] text-text-secondary uppercase tracking-wider">
            <LockIcon style={{ fontSize: '0.6rem' }} />
            Par défaut
          </span>
        )}
      </div>
    </div>
  )
}

export default CategoryCard
