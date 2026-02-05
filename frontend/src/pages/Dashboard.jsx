import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { accountsAPI, budgetsAPI, advancesAPI } from '../api/index.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import ReceiptIcon from '@mui/icons-material/Receipt'
import RepeatIcon from '@mui/icons-material/Repeat'
import SavingsIcon from '@mui/icons-material/Savings'
import PaidIcon from '@mui/icons-material/Paid'
import PersonIcon from '@mui/icons-material/Person'
import TuneIcon from '@mui/icons-material/Tune'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SummaryCard from '../components/features/dashboard/SummaryCard'
import ChartCard from '../components/ui/ChartCard'
import TransactionItem from '../components/features/dashboard/TransactionItem'
import { formatCurrency, formatDate } from '../utils/formatters'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'))
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingData, setLoadingData] = useState(false)

  // États pour les budgets
  const [budgets, setBudgets] = useState([])
  const [loadingBudgets, setLoadingBudgets] = useState(true)

  // États pour les avances
  const [advancesSummary, setAdvancesSummary] = useState(null)
  const [loadingAdvances, setLoadingAdvances] = useState(true)
  const [advancesDirection, setAdvancesDirection] = useState('to_me') // 'to_me' ou 'from_me'
  const [showBudgetOrderModal, setShowBudgetOrderModal] = useState(false)
  const [selectedBudgetOrder, setSelectedBudgetOrder] = useState([])
  const [showAccountDropdown, setShowAccountDropdown] = useState(false)
  const budgetModalRef = useRef(null)

  // Charger les comptes de l'utilisateur
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountsAPI.getByUser(user.id)
        setAccounts(response.data.accounts)
        if (response.data.accounts.length > 0) {
          setSelectedAccountId(response.data.accounts[0].id)
        }
      } catch (err) {
        console.error('Erreur chargement comptes:', err)
      } finally {
        setLoadingAccounts(false)
      }
    }
    fetchAccounts()
  }, [user.id])

  // Charger les données du dashboard quand le compte change
  useEffect(() => {
    if (!selectedAccountId) return

    const fetchDashboard = async () => {
      setLoadingData(true)
      try {
        const response = await accountsAPI.getDashboard(selectedAccountId)
        setDashboardData(response.data)
      } catch (err) {
        console.error('Erreur chargement dashboard:', err)
      } finally {
        setLoadingData(false)
      }
    }
    fetchDashboard()
  }, [selectedAccountId])

  // Charger les budgets de l'utilisateur
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoadingBudgets(true)
      try {
        const response = await budgetsAPI.getByUser(user.id)
        setBudgets(response.data.budgets)
      } catch (err) {
        console.error('Erreur chargement budgets:', err)
      } finally {
        setLoadingBudgets(false)
      }
    }
    fetchBudgets()
  }, [user.id])

  // Charger le résumé des avances (selon la direction)
  useEffect(() => {
    const fetchAdvances = async () => {
      setLoadingAdvances(true)
      try {
        const response = await advancesAPI.getSummary(user.id, advancesDirection)
        setAdvancesSummary(response.data)
      } catch (err) {
        console.error('Erreur chargement avances:', err)
      } finally {
        setLoadingAdvances(false)
      }
    }
    fetchAdvances()
  }, [user.id, advancesDirection])

  // Focus sur la modal des budgets quand elle s'ouvre (pour capturer Échap)
  useEffect(() => {
    if (showBudgetOrderModal && budgetModalRef.current) {
      budgetModalRef.current.focus()
    }
  }, [showBudgetOrderModal])

  // Gestion de la modal d'ordre des budgets
  const openBudgetOrderModal = useCallback(() => {
    // Initialiser avec les budgets qui ont déjà un ordre
    const orderedBudgets = budgets
      .filter(b => b.display_order !== null)
      .sort((a, b) => a.display_order - b.display_order)
      .map(b => b.id)
    setSelectedBudgetOrder(orderedBudgets)
    setShowBudgetOrderModal(true)
  }, [budgets])

  const toggleBudgetSelection = useCallback((budgetId) => {
    setSelectedBudgetOrder(prev => {
      if (prev.includes(budgetId)) {
        // Retirer le budget de la sélection
        return prev.filter(id => id !== budgetId)
      } else {
        // Ajouter le budget à la fin
        return [...prev, budgetId]
      }
    })
  }, [])

  const saveBudgetOrder = async () => {
    try {
      await budgetsAPI.updateOrder(user.id, selectedBudgetOrder)
      // Recharger les budgets
      const response = await budgetsAPI.getByUser(user.id)
      setBudgets(response.data.budgets)
      setShowBudgetOrderModal(false)
    } catch (err) {
      console.error('Erreur sauvegarde ordre:', err)
    }
  }

  // Budgets à afficher dans le dashboard
  const displayedBudgets = useMemo(() => {
    const orderedBudgets = budgets.filter(b => b.display_order !== null)
    if (orderedBudgets.length > 0) {
      return orderedBudgets.sort((a, b) => a.display_order - b.display_order)
    }
    // Si aucun ordre défini, afficher les 3 premiers par défaut
    return budgets.slice(0, 3)
  }, [budgets])


  // Préparer les données pour le Doughnut chart
  const pieChartData = dashboardData?.expenses_by_category ? {
    labels: dashboardData.expenses_by_category.map(cat => cat.name),
    datasets: [{
      data: dashboardData.expenses_by_category.map(cat => cat.total),
      backgroundColor: dashboardData.expenses_by_category.map(cat => cat.color),
      borderWidth: 0,
      hoverOffset: 4
    }]
  } : null

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9ca3af',
          font: { size: 11 },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => {
            const value = formatCurrency(context.raw)
            const percentage = ((context.raw / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
            return `${context.label}: ${value} (${percentage}%)`
          }
        }
      }
    }
  }

  // Préparer les données pour le Bar Chart - Dépenses vs Reste/Déficit
  const comparisonData = dashboardData?.category_comparison
  const currentYear = comparisonData?.current_year || new Date().getFullYear()
  const lastYear = comparisonData?.last_year || currentYear - 1

  const barChartData = comparisonData ? {
    labels: comparisonData.months,
    datasets: [
      // Année courante - Dépenses (rouge)
      {
        label: `Dépenses ${currentYear}`,
        data: comparisonData.data.map(m => Math.min(m.current_year.total_expenses, m.current_year.total_income) || 0),
        backgroundColor: '#ef4444',
        borderRadius: 0,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'current'
      },
      // Année courante - Reste (vert) ou Déficit (rouge foncé)
      {
        label: `Reste ${currentYear}`,
        data: comparisonData.data.map(m => m.current_year.reste || 0),
        backgroundColor: '#22c55e',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'current'
      },
      {
        label: `Déficit ${currentYear}`,
        data: comparisonData.data.map(m => {
          const deficit = m.current_year.total_expenses - m.current_year.total_income
          return deficit > 0 ? deficit : 0
        }),
        backgroundColor: '#991b1b',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'current'
      },
      // Année précédente - Dépenses (rouge transparent)
      {
        label: `Dépenses ${lastYear}`,
        data: comparisonData.data.map(m => Math.min(m.last_year.total_expenses, m.last_year.total_income) || 0),
        backgroundColor: '#ef444460',
        borderRadius: 0,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'lastYear'
      },
      // Année précédente - Reste (vert transparent) ou Déficit (rouge foncé transparent)
      {
        label: `Reste ${lastYear}`,
        data: comparisonData.data.map(m => m.last_year.reste || 0),
        backgroundColor: '#22c55e60',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'lastYear'
      },
      {
        label: `Déficit ${lastYear}`,
        data: comparisonData.data.map(m => {
          const deficit = m.last_year.total_expenses - m.last_year.total_income
          return deficit > 0 ? deficit : 0
        }),
        backgroundColor: '#991b1b60',
        borderRadius: { topLeft: 4, topRight: 4 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
        stack: 'lastYear'
      }
    ]
  } : null

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#9ca3af',
          font: { size: 10 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          filter: (item) => {
            // Ne pas afficher les items avec 0 partout
            return !item.text.includes('Déficit') || barChartData?.datasets[item.datasetIndex]?.data.some(v => v > 0)
          }
        }
      },
      tooltip: {
        backgroundColor: '#1a1a2e',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        filter: (item) => item.raw > 0,
        callbacks: {
          title: (context) => {
            if (!context[0] || !comparisonData) return ''
            const dataIndex = context[0].dataIndex
            const monthData = comparisonData.data[dataIndex]
            return `${monthData.month}${monthData.is_forecast ? ' (prévision)' : ''}`
          },
          label: (context) => {
            if (context.raw === 0) return null
            const label = context.dataset.label.replace(` ${currentYear}`, '').replace(` ${lastYear}`, '')
            const year = context.dataset.stack === 'current' ? currentYear : lastYear
            return `${label} ${year}: ${formatCurrency(context.raw)}`
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#9ca3af', font: { size: 11 } }
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#9ca3af',
          font: { size: 11 },
          callback: (value) => `${value}€`
        }
      }
    }
  }

  // Spinner component
  const Spinner = ({ size = 'md' }) => {
    const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8' }
    return (
      <div className={`${sizeClasses[size]} border-2 border-border border-t-neon-cyan rounded-full animate-spin`} />
    )
  }

  // État de chargement uniquement pour les comptes (premier chargement)
  if (loadingAccounts) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
        <div className="flex items-center justify-center h-[50vh] text-text-secondary">
          <div className="flex flex-col items-center gap-3">
            <Spinner />
            <span>Chargement des comptes...</span>
          </div>
        </div>
      </div>
    )
  }

  // Pas de comptes
  if (accounts.length === 0) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
        <div className="flex flex-col items-center justify-center h-[50vh] text-text-secondary gap-4">
          <AccountBalanceWalletIcon className="text-6xl opacity-50" />
          <p>Aucun compte trouvé</p>
          <p className="text-sm">Créez un compte pour commencer à suivre vos finances</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto max-md:p-4">
      {/* Header avec sélecteur de compte */}
      <div className="flex justify-between items-center mb-4 max-md:flex-col max-md:items-stretch max-md:gap-3">
        <h1 className="text-3xl text-text-primary m-0">Tableau de bord</h1>
        <div className="relative">
          <button
            onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            className="flex items-center gap-2 py-3 px-5 bg-bg-card border border-border rounded-xl text-text-primary font-semibold cursor-pointer transition-all duration-300 hover:border-neon-cyan hover:text-neon-cyan hover:shadow-[0_4px_20px_rgba(0,240,255,0.2)]"
          >
            {selectedAccountId && (() => {
              const account = accounts.find(a => a.id === selectedAccountId)
              return account ? (
                <>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: account.color || '#3b82f6' }}
                  >
                    <img
                      src={account.icon || '/default/icons/wallet.png'}
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <span>{account.name}</span>
                </>
              ) : null
            })()}
            <KeyboardArrowDownIcon
              className={`transition-transform duration-200 ${showAccountDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {showAccountDropdown && (
            <>
              {/* Overlay pour fermer le dropdown */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowAccountDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 min-w-[220px] bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => {
                      setSelectedAccountId(account.id)
                      setShowAccountDropdown(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      account.id === selectedAccountId
                        ? 'bg-neon-cyan/10 text-neon-cyan'
                        : 'text-text-primary hover:bg-bg-secondary'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: account.color || '#3b82f6' }}
                    >
                      <img
                        src={account.icon || '/default/icons/wallet.png'}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    <span className="font-medium">{account.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cartes de résumé */}
      <div className="grid grid-cols-4 gap-3 mb-3 max-lg:grid-cols-2 max-md:grid-cols-1">
        <SummaryCard
          icon={<AccountBalanceWalletIcon />}
          label="Solde actuel"
          value={dashboardData ? formatCurrency(dashboardData.account.balance) : '—'}
          variant="balance"
          loading={loadingData}
        />
        <SummaryCard
          icon={<TrendingUpIcon />}
          label="Revenus du mois"
          value={dashboardData ? `+${formatCurrency(dashboardData.monthly_summary.total_income)}` : '—'}
          variant="income"
          loading={loadingData}
        />
        <SummaryCard
          icon={<TrendingDownIcon />}
          label="Dépenses du mois"
          value={dashboardData ? `-${formatCurrency(dashboardData.monthly_summary.total_expense)}` : '—'}
          variant="expense"
          loading={loadingData}
        />
        <SummaryCard
          icon={<ReceiptIcon />}
          label="Transactions"
          value={dashboardData ? dashboardData.monthly_summary.transaction_count.toString() : '—'}
          variant="info"
          loading={loadingData}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-3 gap-3 mb-3 max-lg:grid-cols-1">
        {/* Doughnut Chart */}
        <ChartCard
          title="Dépenses par catégorie (31 jours)"
          loading={loadingData}
          isEmpty={!pieChartData || pieChartData.datasets[0].data.length === 0}
          emptyMessage="Aucune dépense sur cette période"
        >
          {pieChartData && <Doughnut data={pieChartData} options={pieChartOptions} />}
        </ChartCard>

        {/* Bar Chart */}
        <ChartCard
          title={`Dépenses ${comparisonData?.current_year || ''} vs ${comparisonData?.last_year || ''}`}
          loading={loadingData}
          isEmpty={!barChartData || barChartData.datasets.length === 0}
          emptyMessage="Aucune donnée de comparaison"
          wide
        >
          {barChartData && <Bar data={barChartData} options={barChartOptions} />}
        </ChartCard>
      </div>

      {/* Ligne des 4 encarts */}
      <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-2 max-md:grid-cols-1">
        {/* Dernières dépenses */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <h3 className="m-0 px-4 py-2 flex items-center gap-2 text-base font-semibold text-text-primary border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
            <TrendingDownIcon className="text-red-500" fontSize="small" />
            Dernières dépenses
          </h3>
          {loadingData ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : dashboardData?.last_expenses.length > 0 ? (
            <ul className="list-none p-0 m-0 flex flex-col overflow-y-auto max-h-[180px]">
              {dashboardData.last_expenses.map(tx => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  type="expense"
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12 text-text-secondary text-sm">
              Aucune dépense récente
            </div>
          )}
        </div>

        {/* Derniers revenus */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <h3 className="m-0 px-4 py-2 flex items-center gap-2 text-base font-semibold text-text-primary border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
            <TrendingUpIcon className="text-green-500" fontSize="small" />
            Derniers revenus
          </h3>
          {loadingData ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : dashboardData?.last_incomes.length > 0 ? (
            <ul className="list-none p-0 m-0 flex flex-col overflow-y-auto max-h-[180px]">
              {dashboardData.last_incomes.map(tx => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  type="income"
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12 text-text-secondary text-sm">
              Aucun revenu récent
            </div>
          )}
        </div>

        {/* Récurrences du mois */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="flex flex-col">
            <h3 className="m-0 px-4 py-2 flex items-center gap-2 text-base font-semibold text-text-primary border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
              <RepeatIcon className="text-neon-cyan" fontSize="small" />
              Prélèvements restants ce mois
            </h3>
            {!loadingData && dashboardData && (
              <div className="flex justify-between items-center px-4 py-2 bg-bg-secondary border-b border-border">
                <span className="text-xs text-text-secondary">Solde prévisionnel</span>
                <span className={`text-base font-bold ${dashboardData.recurring.forecasted_balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(dashboardData.recurring.forecasted_balance)}
                </span>
              </div>
            )}
          </div>
          {loadingData ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : dashboardData?.recurring.remaining.length > 0 ? (
            <ul className="list-none p-0 m-0 flex flex-col overflow-y-auto max-h-[180px]">
              {dashboardData.recurring.remaining.map(rec => (
                <li key={rec.id} className="flex items-center gap-2.5 px-4 py-2 transition-colors duration-200 border-b border-white/[0.03] mx-2 my-0.5 last:border-b-0 hover:bg-neon-cyan/[0.03]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: rec.category_color || '#6b7280' }}
                  >
                    <img
                      src={rec.category_icon || '/default/icons/repeat.png'}
                      alt=""
                      className="w-4 h-4 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                      {rec.description || rec.category_name}
                    </span>
                    <span className="text-[0.7rem] text-text-secondary">
                      {formatDate(rec.next_occurrence)}
                    </span>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${rec.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {rec.type === 'income' ? '+' : '-'}{formatCurrency(rec.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12 text-text-secondary text-sm">
              Aucun prélèvement prévu ce mois
            </div>
          )}
        </div>

        {/* Avances en attente */}
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
            <PaidIcon className={advancesDirection === 'to_me' ? 'text-neon-cyan' : 'text-purple-500'} fontSize="small" />
            {/* Toggle direction */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setAdvancesDirection('to_me')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  advancesDirection === 'to_me'
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-transparent text-text-secondary hover:bg-white/5'
                }`}
              >
                À recevoir
              </button>
              <button
                onClick={() => setAdvancesDirection('from_me')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  advancesDirection === 'from_me'
                    ? 'bg-purple-500/20 text-purple-500'
                    : 'bg-transparent text-text-secondary hover:bg-white/5'
                }`}
              >
                À rembourser
              </button>
            </div>
          </div>
          {loadingAdvances ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Spinner size="sm" />
            </div>
          ) : advancesSummary?.totals?.total_pending > 0 ? (
            <>
              {/* Total */}
              <div className="flex justify-between items-center px-4 py-3 bg-bg-secondary border-b border-border">
                <span className="text-sm text-text-secondary">
                  {advancesDirection === 'to_me' ? 'Total à recevoir' : 'Total à rembourser'}
                </span>
                <span className={`text-lg font-bold ${advancesDirection === 'to_me' ? 'text-neon-cyan' : 'text-purple-500'}`}>
                  {formatCurrency(advancesSummary.totals.total_pending)}
                </span>
              </div>
              {/* Liste par personne */}
              <ul className="list-none p-0 m-0 flex flex-col overflow-y-auto max-h-[140px]">
                {advancesSummary.by_person?.map(item => (
                  <li
                    key={item.person}
                    className="flex items-center gap-2.5 px-4 py-2 transition-colors duration-200 border-b border-white/[0.03] mx-2 my-0.5 last:border-b-0 hover:bg-neon-cyan/[0.03]"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      advancesDirection === 'to_me' ? 'bg-neon-cyan/20' : 'bg-purple-500/20'
                    }`}>
                      <PersonIcon className={advancesDirection === 'to_me' ? 'text-neon-cyan' : 'text-purple-500'} style={{ fontSize: 16 }} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.person}
                      </span>
                      <span className="text-[0.7rem] text-text-secondary">
                        {item.count} avance{item.count > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${
                      advancesDirection === 'to_me' ? 'text-neon-cyan' : 'text-purple-500'
                    }`}>
                      {formatCurrency(item.total_pending)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12 text-text-secondary text-sm">
              {advancesDirection === 'to_me' ? 'Aucune avance à recevoir' : 'Aucun remboursement à effectuer'}
            </div>
          )}
        </div>
      </div>

      {/* Section Budgets */}
      <div className="mt-3 bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 border-b border-border bg-gradient-to-r from-neon-cyan/5 to-neon-purple/[0.02]">
          <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-text-primary">
            <SavingsIcon className="text-neon-purple" fontSize="small" />
            Budgets du mois
          </h3>
          <button
            onClick={openBudgetOrderModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg transition-colors"
          >
            <TuneIcon fontSize="small" />
            Configurer
          </button>
        </div>

        {loadingBudgets ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="sm" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-text-secondary text-sm">
            Aucun budget défini
          </div>
        ) : (
          <div className="p-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
            {displayedBudgets.map(budget => (
              <div
                key={budget.id}
                className="bg-bg-secondary border border-border rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: budget.category_color || '#6b7280' }}
                  >
                    <img
                      src={budget.category_icon || '/default/icons/money.png'}
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate m-0">
                      {budget.category_name}
                    </p>
                    <p className="text-xs text-text-secondary m-0">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.budget_amount)}
                    </p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      budget.is_exceeded ? 'bg-red-500' : budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className={`font-medium ${budget.is_exceeded ? 'text-red-500' : 'text-text-secondary'}`}>
                    {budget.is_exceeded ? 'Dépassé' : `${budget.percentage.toFixed(0)}%`}
                  </span>
                  <span className={`font-semibold ${budget.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {budget.remaining >= 0 ? `Reste ${formatCurrency(budget.remaining)}` : `Excès ${formatCurrency(Math.abs(budget.remaining))}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de sélection d'ordre des budgets */}
      {showBudgetOrderModal && (
        <div
          ref={budgetModalRef}
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && setShowBudgetOrderModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 outline-none">
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary m-0">
                Configurer l'affichage des budgets
              </h3>
              <button
                onClick={() => setShowBudgetOrderModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-text-secondary mb-4">
                Cliquez sur les budgets dans l'ordre où vous souhaitez les afficher.
                {selectedBudgetOrder.length === 0 && ' Si aucun n\'est sélectionné, les 3 premiers seront affichés par défaut.'}
              </p>

              <div className="space-y-4">
                {/* Grouper les budgets par parent */}
                {(() => {
                  // Budgets parents (sans parent_budget_id)
                  const parentBudgets = budgets.filter(b => !b.parent_budget_id)
                  // Budgets enfants groupés par parent_budget_id
                  const childrenByParent = budgets
                    .filter(b => b.parent_budget_id)
                    .reduce((acc, b) => {
                      if (!acc[b.parent_budget_id]) acc[b.parent_budget_id] = []
                      acc[b.parent_budget_id].push(b)
                      return acc
                    }, {})

                  return parentBudgets.map(parent => {
                    const children = childrenByParent[parent.id] || []
                    const parentOrderIndex = selectedBudgetOrder.indexOf(parent.id)
                    const isParentSelected = parentOrderIndex !== -1

                    return (
                      <div key={parent.id} className="space-y-2">
                        {/* Budget parent */}
                        <button
                          onClick={() => toggleBudgetSelection(parent.id)}
                          className={`relative w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            isParentSelected
                              ? 'border-neon-cyan bg-neon-cyan/10'
                              : 'border-border bg-bg-secondary hover:border-text-secondary'
                          }`}
                        >
                          {isParentSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-neon-cyan text-bg-primary text-xs font-bold rounded-full flex items-center justify-center">
                              {parentOrderIndex + 1}
                            </div>
                          )}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: parent.category_color || '#6b7280' }}
                          >
                            <img
                              src={parent.category_icon || '/default/icons/money.png'}
                              alt=""
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <span className="text-sm text-text-primary font-medium truncate">
                            {parent.category_name}
                          </span>
                          {children.length > 0 && (
                            <span className="text-xs text-text-secondary ml-auto">
                              {children.length} sous-budget{children.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </button>

                        {/* Budgets enfants */}
                        {children.length > 0 && (
                          <div className="ml-6 grid grid-cols-2 gap-2">
                            {children.map(child => {
                              const childOrderIndex = selectedBudgetOrder.indexOf(child.id)
                              const isChildSelected = childOrderIndex !== -1

                              return (
                                <button
                                  key={child.id}
                                  onClick={() => toggleBudgetSelection(child.id)}
                                  className={`relative flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                                    isChildSelected
                                      ? 'border-neon-cyan bg-neon-cyan/10'
                                      : 'border-border/50 bg-bg-tertiary hover:border-text-secondary'
                                  }`}
                                >
                                  {isChildSelected && (
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neon-cyan text-bg-primary text-xs font-bold rounded-full flex items-center justify-center">
                                      {childOrderIndex + 1}
                                    </div>
                                  )}
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: child.category_color || '#6b7280' }}
                                  >
                                    <img
                                      src={child.category_icon || '/default/icons/money.png'}
                                      alt=""
                                      className="w-3 h-3 object-contain"
                                    />
                                  </div>
                                  <span className="text-xs text-text-primary truncate">
                                    {child.category_name}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            <div className="flex justify-between items-center px-5 py-4 border-t border-border">
              <div>
                {selectedBudgetOrder.length > 0 && (
                  <button
                    onClick={() => setSelectedBudgetOrder([])}
                    className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-lg hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10 transition-all"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBudgetOrderModal(false)}
                  className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:text-text-primary hover:border-text-secondary hover:bg-bg-secondary transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={saveBudgetOrder}
                  className="px-4 py-2 text-sm bg-neon-cyan text-bg-primary font-medium rounded-lg hover:bg-neon-cyan/90 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
