import clsx from 'clsx'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

/**
 * Sélecteur d'icônes avec upload
 * @param {Object} props
 * @param {string} props.selectedIcon - Icône sélectionnée
 * @param {Function} props.onSelect - Callback de sélection
 * @param {Array} props.defaultIcons - Icônes par défaut
 * @param {Array} props.userIcons - Icônes utilisateur
 * @param {boolean} props.uploadingIcon - État de chargement upload
 * @param {Function} props.onUploadClick - Callback click upload
 * @param {Function} props.onDeleteClick - Callback suppression icône
 */
function IconSelector({
  selectedIcon,
  onSelect,
  defaultIcons = [],
  userIcons = [],
  uploadingIcon = false,
  onUploadClick,
  onDeleteClick
}) {
  const selectedUserIcon = userIcons.find(icon => icon.path === selectedIcon)

  return (
    <div className="mt-4 pt-4 border-t border-border">
      {/* Icônes par défaut */}
      <div className="mb-4">
        <span className="block text-xs text-text-secondary mb-2 uppercase tracking-wider">
          Icônes par défaut
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {defaultIcons.map(icon => (
            <button
              key={icon.path}
              type="button"
              className={clsx(
                'w-11 h-11 rounded-lg border-2 bg-bg-secondary cursor-pointer flex items-center justify-center transition-all duration-200 p-0',
                'hover:border-neon-cyan hover:bg-neon-cyan/10',
                selectedIcon === icon.path
                  ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'border-border'
              )}
              onClick={() => onSelect(icon.path)}
              title={icon.name}
            >
              <img src={icon.path} alt={icon.name} className="w-6 h-6 object-contain" />
            </button>
          ))}
        </div>
      </div>

      {/* Icônes utilisateur */}
      {userIcons.length > 0 && (
        <div className="mb-4">
          <span className="block text-xs text-text-secondary mb-2 uppercase tracking-wider">
            Mes icônes
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {userIcons.map(icon => (
              <button
                key={icon.path}
                type="button"
                className={clsx(
                  'w-11 h-11 rounded-lg border-2 bg-bg-secondary cursor-pointer flex items-center justify-center transition-all duration-200 p-0',
                  'hover:border-neon-cyan hover:bg-neon-cyan/10',
                  selectedIcon === icon.path
                    ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'border-border'
                )}
                onClick={() => onSelect(icon.path)}
                title={icon.name}
              >
                <img src={icon.path} alt={icon.name} className="w-6 h-6 object-contain" />
              </button>
            ))}
          </div>
          {selectedUserIcon && (
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 px-3 rounded-lg border border-red-500 bg-transparent text-red-500 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-red-500/10"
              onClick={() => onDeleteClick(selectedUserIcon)}
            >
              <DeleteOutlineIcon fontSize="small" />
              <span>Supprimer cette icône</span>
            </button>
          )}
        </div>
      )}

      {/* Bouton upload */}
      <div>
        <button
          type="button"
          className={clsx(
            'flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg border-2 border-dashed bg-transparent text-text-secondary text-sm font-medium cursor-pointer transition-all duration-200',
            uploadingIcon
              ? 'opacity-60 cursor-not-allowed border-border'
              : 'border-border hover:border-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/5'
          )}
          onClick={onUploadClick}
          disabled={uploadingIcon}
        >
          <CloudUploadIcon fontSize="small" />
          <span>{uploadingIcon ? 'Upload...' : 'Ajouter une icône'}</span>
        </button>
      </div>
    </div>
  )
}

export default IconSelector
