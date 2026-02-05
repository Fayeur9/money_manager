import Select from 'react-select'

// Styles personnalisés pour react-select avec thème sombre
const customStyles = {
	control: (base, state) => ({
		...base,
		backgroundColor: 'var(--bg-secondary)',
		borderColor: state.isFocused ? 'var(--neon-cyan)' : 'var(--border-color)',
		borderRadius: '8px',
		padding: '0.25rem 0.5rem',
		boxShadow: state.isFocused ? '0 0 0 3px rgba(0, 240, 255, 0.1)' : 'none',
		'&:hover': {
			borderColor: 'rgba(0, 240, 255, 0.5)'
		},
		cursor: 'pointer',
		minHeight: '44px'
	}),
	valueContainer: (base) => ({
		...base,
		padding: '0 0.5rem'
	}),
	singleValue: (base) => ({
		...base,
		color: 'var(--text-primary)'
	}),
	placeholder: (base) => ({
		...base,
		color: 'var(--text-secondary)'
	}),
	input: (base) => ({
		...base,
		color: 'var(--text-primary)'
	}),
	menu: (base) => ({
		...base,
		backgroundColor: '#1a1a2e',
		border: '1px solid var(--border-color)',
		borderRadius: '8px',
		boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
		zIndex: 100,
		overflow: 'hidden'
	}),
	menuList: (base) => ({
		...base,
		padding: '0.25rem',
		maxHeight: '300px'
	}),
	option: (base, state) => {
		let bgColor = '#1a1a2e'
		if (state.isSelected && state.isFocused) {
			bgColor = 'rgba(0, 240, 255, 0.25)'
		} else if (state.isSelected) {
			bgColor = 'rgba(0, 240, 255, 0.15)'
		} else if (state.isFocused) {
			bgColor = 'rgba(0, 240, 255, 0.1)'
		}
		return {
			...base,
			backgroundColor: bgColor,
			color: state.isSelected ? 'var(--neon-cyan)' : 'var(--text-primary)',
			padding: '0.75rem 1rem',
			borderRadius: '6px',
			cursor: 'pointer',
			':active': {
				backgroundColor: 'rgba(0, 240, 255, 0.2)'
			}
		}
	},
	group: (base) => ({
		...base,
		paddingTop: 0,
		paddingBottom: 0
	}),
	groupHeading: (base) => ({
		...base,
		color: 'var(--text-secondary)',
		fontSize: '0.7rem',
		fontWeight: 600,
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		padding: '0.75rem 1rem 0.25rem',
		marginBottom: 0,
		borderTop: '1px solid var(--border-color)',
		marginTop: '0.25rem',
		'&:first-of-type': {
			borderTop: 'none',
			marginTop: 0
		}
	}),
	indicatorSeparator: () => ({
		display: 'none'
	}),
	dropdownIndicator: (base, state) => ({
		...base,
		color: 'var(--neon-cyan)',
		transition: 'transform 0.2s ease',
		transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0)',
		'&:hover': {
			color: 'var(--neon-cyan)'
		}
	}),
	clearIndicator: (base) => ({
		...base,
		color: 'var(--text-secondary)',
		'&:hover': {
			color: '#ef4444'
		}
	}),
	noOptionsMessage: (base) => ({
		...base,
		color: 'var(--text-secondary)'
	}),
	menuPortal: (base) => ({
		...base,
		zIndex: 9999
	})
}

// Composant pour afficher une option avec icône
const OptionWithIcon = ({ data, isSelected, isChild }) => (
	<div style={{
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		paddingLeft: isChild ? '1rem' : 0
	}}>
		{data.icon && (
			<div style={{
				width: '28px',
				height: '28px',
				borderRadius: '6px',
				backgroundColor: data.color || '#6b7280',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0
			}}>
				<img
					src={data.icon}
					alt=""
					style={{ width: '14px', height: '14px', objectFit: 'contain' }}
				/>
			</div>
		)}
		<span style={{ color: isSelected ? 'var(--neon-cyan)' : 'inherit' }}>{data.label}</span>
	</div>
)

// Composant Group Header personnalisé (première entrée sans bordure)
const CustomGroupHeading = (props) => {
	const isFirst = props.selectProps.options?.findIndex(g => g.label === props.data.label) === 0
	return (
		<div style={{
			color: 'var(--text-secondary)',
			fontSize: '0.7rem',
			fontWeight: 600,
			textTransform: 'uppercase',
			letterSpacing: '0.05em',
			padding: '0.75rem 1rem 0.25rem',
			borderTop: isFirst ? 'none' : '1px solid var(--border-color)',
			marginTop: isFirst ? 0 : '0.25rem'
		}}>
			{props.children}
		</div>
	)
}

/**
 * Organise les options en groupes basés sur le parent_id
 * @param {Array} options - Les options à grouper
 * @returns {Array} - Options groupées pour react-select
 */
function groupOptionsByParent(options) {
	if (!Array.isArray(options) || options.length === 0) return []

	// Séparer les catégories parentes et enfants
	const parents = options.filter(opt => !opt.parent_id)
	const children = options.filter(opt => opt.parent_id)

	// Créer un map parent_id -> parent (pour les parents présents dans la liste)
	const parentById = {}
	parents.forEach(parent => {
		parentById[parent.value] = parent
	})

	// Créer un map parent_id -> enfants
	const childrenByParent = {}
	children.forEach(child => {
		if (!childrenByParent[child.parent_id]) {
			childrenByParent[child.parent_id] = []
		}
		childrenByParent[child.parent_id].push({ ...child, isChild: true })
	})

	const groups = []
	const processedParentIds = new Set()

	// Groupes avec parents présents dans la liste
	parents.forEach(parent => {
		const parentChildren = childrenByParent[parent.value] || []
		if (parentChildren.length > 0) {
			groups.push({
				label: parent.label,
				options: [
					{ ...parent, isParentOption: true },
					...parentChildren
				]
			})
			processedParentIds.add(parent.value)
		}
	})

	// Groupes pour enfants dont le parent n'est pas dans la liste
	Object.entries(childrenByParent).forEach(([parentId, parentChildren]) => {
		if (!processedParentIds.has(parentId)) {
			// Utiliser parent_name si disponible, sinon fallback
			const parentName = parentChildren[0]?.parent_name || 'Catégorie parente'
			groups.push({
				label: parentName,
				options: parentChildren
			})
		}
	})

	// Catégories parentes sans enfants (orphelines)
	const orphanParents = parents.filter(p => !childrenByParent[p.value])
	if (orphanParents.length > 0) {
		groups.push({
			label: 'Autres catégories',
			options: orphanParents
		})
	}

	return groups
}

function StyledSelect({
	options = [],
	value,
	onChange,
	placeholder = 'Sélectionner...',
	isClearable = false,
	isSearchable = false,
	isDisabled = false,
	showIcons = false,
	groupByParent = false,
	...props
}) {
	// S'assurer que options est toujours un tableau
	const safeOptions = Array.isArray(options) ? options : []

	// Grouper par parent si demandé
	const finalOptions = groupByParent ? groupOptionsByParent(safeOptions) : safeOptions

	// Trouver l'option sélectionnée à partir de la valeur
	const findSelectedOption = () => {
		if (groupByParent) {
			for (const group of finalOptions) {
				const found = group.options?.find(opt => opt.value === value)
				if (found) return found
			}
			return null
		}
		return safeOptions.find(opt => opt.value === value) || null
	}

	const selectedOption = findSelectedOption()

	// Format personnalisé si showIcons est activé
	const formatOptionLabel = showIcons ? (data, { context }) => (
		<OptionWithIcon
			data={data}
			isSelected={context === 'value'}
			isChild={data.isChild}
		/>
	) : undefined

	return (
		<Select
			styles={customStyles}
			options={finalOptions}
			value={selectedOption}
			onChange={(selected) => onChange(selected ? selected.value : '')}
			placeholder={placeholder}
			isClearable={isClearable}
			isSearchable={isSearchable}
			isDisabled={isDisabled}
			noOptionsMessage={() => 'Aucune option'}
			menuPortalTarget={document.body}
			menuPosition="fixed"
			formatOptionLabel={formatOptionLabel}
			components={{ GroupHeading: CustomGroupHeading }}
			filterOption={(option, inputValue) => {
				// Recherche personnalisée incluant le nom du groupe
				if (!inputValue) return true
				const label = option.label?.toLowerCase() || ''
				const search = inputValue.toLowerCase()
				return label.includes(search)
			}}
			{...props}
		/>
	)
}

export default StyledSelect
