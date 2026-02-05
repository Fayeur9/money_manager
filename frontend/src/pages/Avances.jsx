import { useState, useEffect, useMemo, useCallback } from 'react'
import { advancesAPI, accountsAPI } from '../api/index.js'
import { PageHeader } from '../components/layout'
import { FormModal, AdvanceCard, EmptyState } from '../components/ui'
import { AdvanceForm } from '../components/forms'
import { CategoryMissingModal } from '../components/features/advances'
import SummaryCard from '../components/features/dashboard/SummaryCard'
import { formatCurrency } from '../utils/formatters'
import { getDirectionStyles, getDirectionLabels } from '../utils/constants'
import { useModalState } from '../hooks'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import PaidIcon from '@mui/icons-material/Paid'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import CallMadeIcon from '@mui/icons-material/CallMade'

// Configuration des onglets de direction
const DIRECTION_TABS = [
  { value: 'given', icon: CallMadeIcon },
  { value: 'received', icon: CallReceivedIcon }
]

// Configuration des filtres
const FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partielles' },
  { value: 'paid', label: 'Remboursées' }
]

function Avances() {
  const user = JSON.parse(localStorage.getItem('user'))
  const [advances, setAdvances] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('given')

  // Styles et labels basés sur la direction active
  const directionStyles = getDirectionStyles(activeTab)
  const directionLabels = getDirectionLabels(activeTab)

  // Modals
  const createModal = useModalState()
  const editModal = useModalState()

  // Erreurs API
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')

  // Modal de catégories manquantes
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Charger les avances
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [advancesRes, accountsRes] = await Promise.all([
          advancesAPI.getByUser(user.id),
          accountsAPI.getByUser(user.id)
        ])
        setAdvances(advancesRes.data.advances || [])
        setAccounts(accountsRes.data.accounts || [])
      } catch (err) {
        console.error('Erreur chargement avances:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user.id])

  // Ordre des statuts pour le tri
  const statusOrder = { pending: 0, partial: 1, paid: 2 }

  // Avances filtrées par direction (onglet actif)
  const advancesByDirection = useMemo(() => {
    return advances.filter(a => (a.direction || 'given') === activeTab)
  }, [advances, activeTab])

  // Filtrer et trier les avances
  // Par défaut (all), on n'affiche pas les remboursés - ils ne sont visibles que via le filtre "paid"
  const filteredAdvances = useMemo(() => {
    let result
    if (filter === 'all') {
      result = advancesByDirection.filter(a => a.status !== 'paid')
    } else {
      result = advancesByDirection.filter(a => a.status === filter)
    }
    return result.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return new Date(b.date) - new Date(a.date)
    })
  }, [advancesByDirection, filter])

  // Résumé par statut (basé sur l'onglet actif)
  const summary = useMemo(() => {
    const pending = advancesByDirection.filter(a => a.status === 'pending')
    const partial = advancesByDirection.filter(a => a.status === 'partial')
    const paid = advancesByDirection.filter(a => a.status === 'paid')

    const totalPending = pending.reduce((sum, a) => sum + (a.amount - a.amount_received), 0)
    const totalPartial = partial.reduce((sum, a) => sum + (a.amount - a.amount_received), 0)
    const totalRemaining = totalPending + totalPartial

    return { pending, partial, paid, totalPending, totalPartial, totalRemaining }
  }, [advancesByDirection])

  // Résumé par personne (basé sur l'onglet actif)
  const summaryByPerson = useMemo(() => {
    const byPerson = {}
    advancesByDirection.filter(a => a.status !== 'paid').forEach(a => {
      const remaining = a.amount - a.amount_received
      if (!byPerson[a.person]) {
        byPerson[a.person] = { count: 0, total: 0 }
      }
      byPerson[a.person].count++
      byPerson[a.person].total += remaining
    })
    return Object.entries(byPerson).sort((a, b) => b[1].total - a[1].total)
  }, [advancesByDirection])

  // Créer une avance
  const handleCreate = useCallback(async (formData, skipTransaction = false) => {
    setCreateError('')
    try {
      const response = await advancesAPI.create({
        user_id: user.id,
        skip_transaction: skipTransaction,
        direction: activeTab,
        ...formData
      })
      setAdvances(prev => [response.data.advance, ...prev])
      createModal.close()
    } catch (err) {
      console.error('Erreur création avance:', err)
      const detail = err.response?.data?.detail

      if (detail?.error_code === 'MISSING_CATEGORY') {
        setPendingAction({ type: 'create', data: formData })
        setShowCategoryModal(true)
        return
      }

      const message = typeof detail === 'string' ? detail : detail?.message || 'Erreur lors de la création de l\'avance'
      setCreateError(message)
    }
  }, [user.id, createModal, activeTab])

  // Modifier une avance
  const handleUpdate = useCallback(async (formData) => {
    if (!editModal.data) return
    setEditError('')

    try {
      const response = await advancesAPI.update(editModal.data.id, formData)
      setAdvances(prev => prev.map(a =>
        a.id === editModal.data.id ? response.data.advance : a
      ))
      editModal.close()
    } catch (err) {
      console.error('Erreur modification avance:', err)
      const message = err.response?.data?.detail || 'Erreur lors de la modification de l\'avance'
      setEditError(message)
    }
  }, [editModal])

  // Supprimer une avance
  const handleDelete = useCallback(async () => {
    if (!editModal.data) return
    setEditError('')

    try {
      await advancesAPI.delete(editModal.data.id)
      setAdvances(prev => prev.filter(a => a.id !== editModal.data.id))
      editModal.close()
    } catch (err) {
      console.error('Erreur suppression avance:', err)
      const message = err.response?.data?.detail || 'Erreur lors de la suppression de l\'avance'
      setEditError(message)
    }
  }, [editModal])

  // Enregistrer un remboursement
  const handlePayment = useCallback(async (amount, skipTransaction = false) => {
    if (!editModal.data) return
    setEditError('')

    try {
      const response = await advancesAPI.addPayment(editModal.data.id, amount, skipTransaction)
      setAdvances(prev => prev.map(a =>
        a.id === editModal.data.id ? response.data.advance : a
      ))
      editModal.close()
    } catch (err) {
      console.error('Erreur enregistrement remboursement:', err)
      const detail = err.response?.data?.detail

      if (detail?.error_code === 'MISSING_CATEGORY') {
        setPendingAction({ type: 'payment', data: { amount, advanceId: editModal.data.id } })
        setShowCategoryModal(true)
        return
      }

      const message = typeof detail === 'string' ? detail : detail?.message || 'Erreur lors de l\'enregistrement du remboursement'
      setEditError(message)
    }
  }, [editModal])

  // Créer les catégories et réessayer l'action
  const handleCreateCategories = useCallback(async () => {
    if (!pendingAction) return
    setCategoryLoading(true)

    try {
      await advancesAPI.createCategories(user.id)

      if (pendingAction.type === 'create') {
        await handleCreate(pendingAction.data, false)
      } else if (pendingAction.type === 'payment') {
        await advancesAPI.addPayment(pendingAction.data.advanceId, pendingAction.data.amount, false)
          .then(response => {
            setAdvances(prev => prev.map(a =>
              a.id === pendingAction.data.advanceId ? response.data.advance : a
            ))
            editModal.close()
          })
      }

      setShowCategoryModal(false)
      setPendingAction(null)
    } catch (err) {
      console.error('Erreur création catégories:', err)
      const message = err.response?.data?.detail || 'Erreur lors de la création des catégories'
      if (pendingAction.type === 'create') {
        setCreateError(typeof message === 'string' ? message : 'Erreur lors de la création')
      } else {
        setEditError(typeof message === 'string' ? message : 'Erreur lors de la création')
      }
      setShowCategoryModal(false)
      setPendingAction(null)
    } finally {
      setCategoryLoading(false)
    }
  }, [pendingAction, user.id, handleCreate, editModal])

  // Continuer sans créer de transaction
  const handleSkipTransaction = useCallback(async () => {
    if (!pendingAction) return
    setCategoryLoading(true)

    try {
      if (pendingAction.type === 'create') {
        await handleCreate(pendingAction.data, true)
      } else if (pendingAction.type === 'payment') {
        const response = await advancesAPI.addPayment(pendingAction.data.advanceId, pendingAction.data.amount, true)
        setAdvances(prev => prev.map(a =>
          a.id === pendingAction.data.advanceId ? response.data.advance : a
        ))
        editModal.close()
      }

      setShowCategoryModal(false)
      setPendingAction(null)
    } catch (err) {
      console.error('Erreur:', err)
      const message = err.response?.data?.detail || 'Une erreur est survenue'
      if (pendingAction.type === 'create') {
        setCreateError(typeof message === 'string' ? message : 'Erreur')
      } else {
        setEditError(typeof message === 'string' ? message : 'Erreur')
      }
      setShowCategoryModal(false)
      setPendingAction(null)
    } finally {
      setCategoryLoading(false)
    }
  }, [pendingAction, handleCreate, editModal])

  // Bouton "Nouvelle avance/emprunt" réutilisable
  const NewAdvanceButton = ({ className = '' }) => (
    <button
      onClick={() => createModal.open()}
      className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-colors ${directionStyles.button} ${className}`}
    >
      <AddIcon fontSize="small" />
      {directionLabels.new}
    </button>
  )

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="w-8 h-8 border-2 border-border border-t-neon-cyan rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto max-md:p-4 h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Remboursements"
        actions={<NewAdvanceButton />}
      />

      {/* Onglets direction */}
      <div className="flex gap-2 mb-6 flex-shrink-0">
        {DIRECTION_TABS.map(({ value, icon: Icon }) => {
          const tabStyles = getDirectionStyles(value)
          const tabLabels = getDirectionLabels(value)
          const isActive = activeTab === value
          return (
            <button
              key={value}
              onClick={() => { setActiveTab(value); setFilter('all') }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                isActive
                  ? tabStyles.buttonOutline
                  : 'bg-bg-card border border-border text-text-secondary hover:text-text-primary hover:border-border-hover'
              }`}
            >
              <Icon fontSize="small" />
              {tabLabels.tab}
            </button>
          )
        })}
      </div>

      {/* Cartes de résumé */}
      <div className="grid grid-cols-4 gap-4 mb-6 max-lg:grid-cols-2 max-md:grid-cols-1 flex-shrink-0">
        <SummaryCard
          icon={<PaidIcon />}
          label={directionLabels.total}
          value={formatCurrency(summary.totalRemaining)}
          color={activeTab === 'given' ? 'neon-cyan' : 'neon-purple'}
          size="md"
          hover={false}
        />
        <SummaryCard
          icon={<ScheduleIcon />}
          label="En attente"
          value={summary.pending.length}
          color="yellow-500"
          size="md"
          hover={false}
        />
        <SummaryCard
          icon={<WarningIcon />}
          label="Partiellement remboursé"
          value={summary.partial.length}
          color="orange-500"
          size="md"
          hover={false}
        />
        <SummaryCard
          icon={<CheckCircleIcon />}
          label="Remboursé"
          value={summary.paid.length}
          color="green-500"
          size="md"
          hover={false}
        />
      </div>

      <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1 flex-1 min-h-0">
        {/* Liste des avances */}
        <div className="col-span-2 bg-bg-card border border-border rounded-xl overflow-hidden flex flex-col min-h-0">
          {/* Filtres */}
          <div className="flex gap-2 p-4 border-b border-border flex-shrink-0">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === f.value
                    ? directionStyles.buttonOutline
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredAdvances.length === 0 ? (
              <EmptyState
                icon={PaidIcon}
                message={directionLabels.empty}
                description={filter !== 'all'
                  ? `Aucun${activeTab === 'received' ? ' emprunt' : 'e avance'} avec ce statut`
                  : directionLabels.emptyDescription}
                className="h-full"
                action={filter === 'all' && <NewAdvanceButton />}
              />
            ) : (
              <div className="p-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                {filteredAdvances.map(advance => {
                  const account = accounts.find(a => a.id === advance.account_id)
                  return (
                    <AdvanceCard
                      key={advance.id}
                      advance={advance}
                      accountName={account?.name}
                      onClick={() => editModal.open(advance)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Résumé par personne */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden flex flex-col max-lg:h-auto">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <PersonIcon fontSize="small" />
              {directionLabels.sidebar}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {summaryByPerson.length === 0 ? (
              <div className="p-4 text-center text-text-secondary text-sm">
                {directionLabels.sidebarEmpty}
              </div>
            ) : (
              <div className="p-4 flex flex-col gap-2">
                {summaryByPerson.map(([person, data]) => (
                  <div key={person} className="p-3 flex items-center justify-between bg-bg-secondary/50 border border-border rounded-lg hover:border-border-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${directionStyles.bg} ${directionStyles.text}`}>
                        {person.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{person}</p>
                        <p className="text-xs text-text-secondary">
                          {data.count} {directionLabels.itemType}{data.count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${directionStyles.text}`}>
                      {formatCurrency(data.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal création */}
      <FormModal
        isOpen={createModal.isOpen}
        onClose={() => { createModal.close(); setCreateError('') }}
        title={directionLabels.new}
      >
        <AdvanceForm
          accounts={accounts}
          onSubmit={handleCreate}
          onCancel={() => { createModal.close(); setCreateError('') }}
          submitLabel="Créer"
          apiError={createError}
          direction={activeTab}
        />
      </FormModal>

      {/* Modal édition */}
      <FormModal
        isOpen={editModal.isOpen}
        onClose={() => { editModal.close(); setEditError('') }}
        title={editModal.data?.direction === 'received' ? "Modifier l'emprunt" : "Modifier l'avance"}
      >
        <AdvanceForm
          initialData={editModal.data || {}}
          accounts={accounts}
          onSubmit={handleUpdate}
          onCancel={() => { editModal.close(); setEditError('') }}
          onDelete={handleDelete}
          onPayment={handlePayment}
          submitLabel="Enregistrer"
          apiError={editError}
          direction={editModal.data?.direction || 'given'}
        />
      </FormModal>

      {/* Modal catégories manquantes */}
      <CategoryMissingModal
        isOpen={showCategoryModal}
        onCreateCategories={handleCreateCategories}
        onSkipTransaction={handleSkipTransaction}
        onCancel={() => {
          setShowCategoryModal(false)
          setPendingAction(null)
        }}
        loading={categoryLoading}
      />
    </div>
  )
}

export default Avances
