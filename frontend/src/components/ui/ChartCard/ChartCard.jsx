import clsx from 'clsx'

/**
 * Container pour charts avec état de chargement
 * @param {Object} props
 * @param {string} props.title - Titre du chart
 * @param {React.ReactNode} props.children - Contenu (chart)
 * @param {boolean} props.loading - État de chargement
 * @param {boolean} props.isEmpty - Pas de données
 * @param {string} props.emptyMessage - Message quand vide
 * @param {boolean} props.wide - Prend 2 colonnes
 * @param {string} props.className - Classes additionnelles
 */
function ChartCard({
  title,
  children,
  loading = false,
  isEmpty = false,
  emptyMessage = 'Aucune donnée disponible',
  wide = false,
  className
}) {
  return (
    <div className={clsx(
      'bg-bg-card border border-border rounded-2xl overflow-hidden',
      wide && 'col-span-2 max-md:col-span-1',
      className
    )}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
        <h3 className="m-0 text-base font-semibold text-text-primary">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-3 h-[200px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-border border-t-neon-cyan rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Chargement...</span>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export default ChartCard
