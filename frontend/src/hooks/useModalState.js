import { useState, useCallback } from 'react'

/**
 * Hook pour gérer l'état d'une modal avec données optionnelles
 * @param {any} initialData - Données initiales quand la modal est fermée
 * @returns {object} { isOpen, data, open, close }
 *
 * @example
 * // Modal simple
 * const createModal = useModalState()
 * createModal.open()
 * createModal.close()
 *
 * @example
 * // Modal avec entité
 * const editModal = useModalState()
 * editModal.open(transaction)
 * // editModal.data contient la transaction
 * editModal.close()
 *
 * @example
 * // Modal avec données initiales
 * const createModal = useModalState({ parentId: null })
 * createModal.open({ parentId: 123 })
 */
function useModalState(initialData = null) {
	const [state, setState] = useState({
		isOpen: false,
		data: initialData
	})

	const open = useCallback((data = null) => {
		setState({ isOpen: true, data })
	}, [])

	const close = useCallback(() => {
		setState({ isOpen: false, data: initialData })
	}, [initialData])

	return {
		isOpen: state.isOpen,
		data: state.data,
		open,
		close
	}
}

export default useModalState
