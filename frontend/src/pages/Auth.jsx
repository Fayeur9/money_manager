import { useState } from "react"
import { authAPI } from "../api"
import { useNavigate } from "react-router-dom"
import FormInput from "../components/ui/FormInput"

function Auth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [isLogin, setIsLogin] = useState(true)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    last_name: '',
    first_name: '',
    email: '',
    password: '',
    password_confirmation: ''
  })

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }))
    }
  }

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }))
    }
    if (e.target.name === 'password' && registerData.password_confirmation) {
      if (e.target.value !== registerData.password_confirmation) {
        setErrors(prev => ({ ...prev, password_confirmation: 'Les mots de passe ne correspondent pas' }))
      } else {
        setErrors(prev => ({ ...prev, password_confirmation: null }))
      }
    }
  }

  const handlePasswordConfirmBlur = () => {
    if (registerData.password_confirmation && registerData.password !== registerData.password_confirmation) {
      setErrors(prev => ({ ...prev, password_confirmation: 'Les mots de passe ne correspondent pas' }))
    }
  }

  const handleRequiredBlur = (e) => {
    const { name, value } = e.target
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [name]: 'Ce champ est obligatoire' }))
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    const newErrors = {}
    if (!loginData.email.trim()) {
      newErrors.email = 'Ce champ est obligatoire'
    }
    if (!loginData.password.trim()) {
      newErrors.password = 'Ce champ est obligatoire'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.login(loginData.email, loginData.password)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/')
    } catch (err) {
      if (err.response?.data?.detail) {
        setErrors({ general: err.response.data.detail })
      } else {
        setErrors({ general: "Une erreur est survenue" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()

    const { last_name, first_name, email, password, password_confirmation } = registerData
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Ce champ est obligatoire'
    }
    if (!password.trim()) {
      newErrors.password = 'Ce champ est obligatoire'
    }
    if (!password_confirmation.trim()) {
      newErrors.password_confirmation = 'Ce champ est obligatoire'
    } else if (password !== password_confirmation) {
      newErrors.password_confirmation = 'Les mots de passe ne correspondent pas'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register({
        email,
        password,
        first_name,
        last_name
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/')
    } catch (err) {
      if (err.response?.data?.detail) {
        setErrors({ general: err.response.data.detail })
      } else {
        setErrors({ general: "Une erreur est survenue" })
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (mode) => {
    setIsLogin(mode === 'login')
    setErrors({})
  }

  return (
    <div className="h-screen flex items-center justify-center p-4 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(0,240,255,0.1)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.1)_0%,transparent_50%),var(--color-bg-primary)]">
      <div className="w-full max-w-[420px] bg-bg-secondary border border-border rounded-2xl p-8 max-sm:p-5">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl mb-1">{isLogin ? "Connexion" : "Inscription"}</h1>
          <p className="text-text-secondary text-sm">
            {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </p>
        </div>

        {/* Formulaire Login */}
        {isLogin ? (
          <form className="flex flex-col gap-4" onSubmit={handleLoginSubmit}>
            <FormInput
              label="Email ou identifiant"
              type="text"
              name="email"
              placeholder="Entrez votre email"
              value={loginData.email}
              onChange={handleLoginChange}
              onBlur={handleRequiredBlur}
              error={errors.email}
              required
            />
            <FormInput
              label="Mot de passe"
              type="password"
              name="password"
              placeholder="Entrez votre mot de passe"
              value={loginData.password}
              onChange={handleLoginChange}
              onBlur={handleRequiredBlur}
              error={errors.password}
              required
            />

            {errors.general && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg text-sm text-center">
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3.5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white text-base font-semibold cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,240,255,0.3)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? 'Chargement...' : 'Se connecter'}
            </button>

            <p className="text-center text-text-secondary text-sm mt-2">
              Pas encore de compte ?{" "}
              <span
                onClick={() => switchMode("register")}
                className="text-neon-cyan cursor-pointer font-medium transition-all duration-300 hover:text-neon-pink hover:shadow-[0_0_10px_var(--color-neon-pink)]"
              >
                Inscrivez-vous ici
              </span>
            </p>
          </form>
        ) : (
          /* Formulaire Register */
          <form className="flex flex-col gap-4" onSubmit={handleRegisterSubmit}>
            <div className="flex gap-3 max-sm:flex-col max-sm:gap-4">
              <FormInput
                label="Nom"
                type="text"
                name="last_name"
                placeholder="Votre nom"
                value={registerData.last_name}
                onChange={handleRegisterChange}
                className="flex-1"
              />
              <FormInput
                label="Prénom"
                type="text"
                name="first_name"
                placeholder="Votre prénom"
                value={registerData.first_name}
                onChange={handleRegisterChange}
                className="flex-1"
              />
            </div>

            <FormInput
              label="Email ou identifiant"
              type="text"
              name="email"
              placeholder="Choisissez un email"
              value={registerData.email}
              onChange={handleRegisterChange}
              onBlur={handleRequiredBlur}
              error={errors.email}
              required
            />
            <FormInput
              label="Mot de passe"
              type="password"
              name="password"
              placeholder="Choisissez un mot de passe"
              value={registerData.password}
              onChange={handleRegisterChange}
              onBlur={handleRequiredBlur}
              error={errors.password}
              required
            />
            <FormInput
              label="Confirmer le mot de passe"
              type="password"
              name="password_confirmation"
              placeholder="Confirmez votre mot de passe"
              value={registerData.password_confirmation}
              onChange={handleRegisterChange}
              onBlur={handlePasswordConfirmBlur}
              error={errors.password_confirmation}
              required
            />

            {errors.general && (
              <p className="bg-red-500/10 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg text-sm text-center">
                {errors.general}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3.5 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white text-base font-semibold cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(0,240,255,0.3)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {loading ? 'Chargement...' : "S'inscrire"}
            </button>

            <p className="text-center text-text-secondary text-sm mt-2">
              Déjà un compte ?{" "}
              <span
                onClick={() => switchMode("login")}
                className="text-neon-cyan cursor-pointer font-medium transition-all duration-300 hover:text-neon-pink hover:shadow-[0_0_10px_var(--color-neon-pink)]"
              >
                Connectez-vous ici
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Auth
