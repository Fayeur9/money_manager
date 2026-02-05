import StyledSelect from './StyledSelect'

/**
 * Composant de sélection de catégories avec groupement hiérarchique automatique.
 *
 * @param {Array} categories - Liste des catégories (déjà filtrées selon les restrictions)
 *   Chaque catégorie doit avoir: id, name, icon, color, et optionnellement parent_id, parent_name
 * @param {string} value - ID de la catégorie sélectionnée
 * @param {function} onChange - Callback appelé avec l'ID de la catégorie sélectionnée
 * @param {string} placeholder - Texte du placeholder
 * @param {boolean} isSearchable - Activer la recherche (défaut: true)
 * @param {boolean} groupByParent - Grouper par catégorie parente (défaut: true)
 * @param {boolean} isClearable - Permettre de vider la sélection (défaut: false)
 * @param {boolean} isDisabled - Désactiver le select (défaut: false)
 */
function CategorySelect({
	categories = [],
	value,
	onChange,
	placeholder = 'Sélectionner une catégorie',
	isSearchable = true,
	groupByParent = true,
	isClearable = false,
	isDisabled = false,
	...props
}) {
	// Transformer les catégories en options pour StyledSelect
	const options = categories.map(cat => ({
		value: cat.id,
		label: cat.name,
		icon: cat.icon,
		color: cat.color,
		parent_id: cat.parent_id,
		parent_name: cat.parent_name
	}))

	return (
		<StyledSelect
			options={options}
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			showIcons
			isSearchable={isSearchable}
			groupByParent={groupByParent}
			isClearable={isClearable}
			isDisabled={isDisabled}
			{...props}
		/>
	)
}

export default CategorySelect
