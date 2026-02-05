import { useState, useRef, useEffect } from 'react'
import { usersAPI } from '../api/index.js'
import AvatarUser from "../components/AvatarUser.jsx"
import Modal from '../components/ui/Modal'
import FormInput from '../components/ui/FormInput'
import ColorPicker from '../components/ui/ColorPicker'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import DeleteIcon from '@mui/icons-material/Delete'
import LockIcon from '@mui/icons-material/Lock'
import EmailIcon from '@mui/icons-material/Email'

function Profil() {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const [userData, setUserData] = useState({
    last_name: user?.last_name || '',
    first_name: user?.first_name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
    avatar_color: user?.avatar_color || '#6366f1',
  })

  const [editData, setEditData] = useState({ ...userData })
  const [previewImage, setPreviewImage] = useState(null)

  // Modals state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Détection des modifications non enregistrées
  const hasUnsavedChanges = () => {
    if (!isEditing) return false
    return (
      editData.first_name !== userData.first_name ||
      editData.last_name !== userData.last_name ||
      editData.avatar_color !== userData.avatar_color
    )
  }

  // Gestion de la touche Échap en mode édition
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isEditing) {
        // Calcul inline pour éviter les problèmes de closure
        const hasChanges =
          editData.first_name !== userData.first_name ||
          editData.last_name !== userData.last_name ||
          editData.avatar_color !== userData.avatar_color

        if (hasChanges) {
          const confirmCancel = window.confirm(
            'Vous avez des modifications non enregistrées. Voulez-vous vraiment annuler ?'
          )
          if (confirmCancel) {
            setEditData({ ...userData })
            setPreviewImage(null)
            setIsEditing(false)
          }
        } else {
          setEditData({ ...userData })
          setPreviewImage(null)
          setIsEditing(false)
        }
      }
    }

    if (isEditing) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isEditing, editData, userData])
  const [emailModalData, setEmailModalData] = useState({ newEmail: '', password: '' })
  const [passwordModalData, setPasswordModalData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState(null)

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value })
  }

  const handleColorChange = (color) => {
    setEditData({ ...editData, avatar_color: color })
  }

  const handleEdit = () => {
    setEditData({ ...userData })
    setPreviewImage(null)
    setIsEditing(true)
    setMessage(null)
  }

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      const confirmCancel = window.confirm(
        'Vous avez des modifications non enregistrées. Voulez-vous vraiment annuler ?'
      )
      if (!confirmCancel) return
    }
    setEditData({ ...userData })
    setPreviewImage(null)
    setIsEditing(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Format non supporté. Utilisez PNG, JPG ou WebP.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image trop volumineuse (max 5MB)' })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setPreviewImage(e.target.result)
    reader.readAsDataURL(file)
    handleAvatarUpload(file)
  }

  const handleAvatarUpload = async (file) => {
    setUploadingAvatar(true)
    setMessage(null)

    try {
      const response = await usersAPI.uploadAvatar(user.id, file)
      const updatedUser = { ...user, ...response.data.user }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setUserData(prev => ({ ...prev, avatar_url: response.data.user.avatar_url }))
      setEditData(prev => ({ ...prev, avatar_url: response.data.user.avatar_url }))
      setMessage({ type: 'success', text: 'Photo de profil mise à jour' })
    } catch (error) {
      console.error('Erreur upload:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'upload de l\'image' })
      setPreviewImage(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!userData.avatar_url) return

    setUploadingAvatar(true)
    setMessage(null)

    try {
      await usersAPI.deleteAvatar(user.id)
      const updatedUser = { ...user, avatar_url: null }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setUserData(prev => ({ ...prev, avatar_url: null }))
      setEditData(prev => ({ ...prev, avatar_url: null }))
      setPreviewImage(null)
      setMessage({ type: 'success', text: 'Photo de profil supprimée' })
    } catch (error) {
      console.error('Erreur suppression:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await usersAPI.updateProfile(user.id, {
        first_name: editData.first_name,
        last_name: editData.last_name,
        avatar_color: editData.avatar_color
      })

      const updatedUser = { ...user, ...response.data.user }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUserData(editData)
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    } finally {
      setLoading(false)
    }
  }

  // Email modal handlers
  const openEmailModal = () => {
    setEmailModalData({ newEmail: '', password: '' })
    setModalError(null)
    setShowEmailModal(true)
  }

  const closeEmailModal = () => {
    setShowEmailModal(false)
    setEmailModalData({ newEmail: '', password: '' })
    setModalError(null)
  }

  const handleEmailChange = async (e) => {
    e.preventDefault()
    if (!emailModalData.newEmail.trim() || !emailModalData.password.trim()) {
      setModalError('Veuillez remplir tous les champs')
      return
    }

    setModalLoading(true)
    setModalError(null)

    try {
      const response = await usersAPI.updateEmail(user.id, {
        new_email: emailModalData.newEmail,
        password: emailModalData.password
      })
      const updatedUser = { ...user, email: response.data.user.email }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUserData(prev => ({ ...prev, email: response.data.user.email }))
      setMessage({ type: 'success', text: 'Email mis à jour avec succès' })
      closeEmailModal()
    } catch (error) {
      console.error('Erreur:', error)
      setModalError(error.response?.data?.detail || 'Erreur lors de la mise à jour de l\'email')
    } finally {
      setModalLoading(false)
    }
  }

  // Password modal handlers
  const openPasswordModal = () => {
    setPasswordModalData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setModalError(null)
    setShowPasswordModal(true)
  }

  const closePasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordModalData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setModalError(null)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwordModalData.currentPassword.trim() || !passwordModalData.newPassword.trim() || !passwordModalData.confirmPassword.trim()) {
      setModalError('Veuillez remplir tous les champs')
      return
    }

    if (passwordModalData.newPassword !== passwordModalData.confirmPassword) {
      setModalError('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordModalData.newPassword.length < 6) {
      setModalError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setModalLoading(true)
    setModalError(null)

    try {
      await usersAPI.updatePassword(user.id, {
        current_password: passwordModalData.currentPassword,
        new_password: passwordModalData.newPassword
      })
      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' })
      closePasswordModal()
    } catch (error) {
      console.error('Erreur:', error)
      setModalError(error.response?.data?.detail || 'Erreur lors de la mise à jour du mot de passe')
    } finally {
      setModalLoading(false)
    }
  }

  const avatarDisplayData = previewImage
    ? { ...editData, avatar_url: previewImage }
    : (isEditing ? editData : userData)

  return (
    <div className="p-8 min-h-full max-md:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header avec avatar */}
        <div className="flex items-start gap-8 mb-8 pb-8 border-b border-border max-sm:flex-col max-sm:items-center max-sm:text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative inline-block">
              <AvatarUser user={avatarDisplayData} size="large" />

              {isEditing && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 p-1.5 bg-black/85 rounded-full">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    hidden
                  />
                  <button
                    className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 p-0 bg-neon-cyan text-bg-primary hover:bg-[#00d4e0] hover:scale-110 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    title="Changer la photo"
                  >
                    <PhotoCameraIcon fontSize="small" />
                  </button>
                  {(userData.avatar_url || previewImage) && (
                    <button
                      className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 p-0 bg-red-500 text-white hover:bg-red-600 hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      onClick={handleDeleteAvatar}
                      disabled={uploadingAvatar}
                      title="Supprimer la photo"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  )}
                </div>
              )}

              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-neon-cyan rounded-full animate-spin" />
                </div>
              )}
            </div>

            {isEditing && !userData.avatar_url && !previewImage && (
              <ColorPicker
                value={editData.avatar_color}
                onChange={handleColorChange}
                label="Couleur de l'avatar"
              />
            )}
          </div>

          <div className="flex-1 pt-2">
            <h1 className="text-3xl mb-2">Mon Profil</h1>
            <p className="text-text-secondary text-base">Gérez vos informations personnelles</p>
          </div>
        </div>

        {/* Message de feedback */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center font-medium ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Card infos personnelles */}
        <div className="bg-bg-secondary border border-border rounded-xl p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border max-sm:flex-col max-sm:gap-4">
            <h2 className="text-xl text-text-primary">Informations personnelles</h2>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 bg-transparent border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <EditIcon fontSize="small" />
                Modifier
              </button>
            ) : (
              <div className="flex gap-3 max-sm:w-full max-sm:justify-center">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 bg-transparent border border-border text-text-secondary hover:border-text-secondary hover:text-text-primary"
                >
                  <CancelIcon fontSize="small" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-gradient-to-br from-neon-cyan to-neon-purple border-none text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:translate-y-[-1px] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <SaveIcon fontSize="small" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Prénom</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]"
                />
              ) : (
                <p className="text-lg text-text-primary py-3">{userData.first_name || '—'}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Nom</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-text-primary text-base transition-all duration-300 focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_0_3px_rgba(0,240,255,0.1)]"
                />
              ) : (
                <p className="text-lg text-text-primary py-3">{userData.last_name || '—'}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 col-span-2 max-sm:col-span-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Email</label>
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg text-text-secondary">{userData.email}</p>
                <button
                  type="button"
                  onClick={openEmailModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-border rounded-md text-text-secondary text-xs cursor-pointer transition-all duration-200 hover:border-neon-cyan hover:text-neon-cyan"
                >
                  <EmailIcon fontSize="small" />
                  Modifier
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 col-span-2 max-sm:col-span-1">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Mot de passe</label>
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg text-text-secondary">••••••••</p>
                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent border border-border rounded-md text-text-secondary text-xs cursor-pointer transition-all duration-200 hover:border-neon-cyan hover:text-neon-cyan"
                >
                  <LockIcon fontSize="small" />
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal modification email */}
      <Modal
        isOpen={showEmailModal}
        onClose={closeEmailModal}
        title="Modifier l'email"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={closeEmailModal}
              className="px-5 py-3 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="email-form"
              disabled={modalLoading}
              className="px-5 py-3 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white font-semibold cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_15px_rgba(0,240,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {modalLoading ? 'Modification...' : 'Modifier'}
            </button>
          </>
        }
      >
        <form id="email-form" onSubmit={handleEmailChange}>
          {modalError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
              {modalError}
            </div>
          )}
          <FormInput
            label="Nouvel email"
            type="email"
            name="newEmail"
            value={emailModalData.newEmail}
            onChange={(e) => setEmailModalData({ ...emailModalData, newEmail: e.target.value })}
            placeholder="nouveau@email.com"
            className="mb-5"
          />
          <FormInput
            label="Mot de passe actuel"
            type="password"
            name="password"
            value={emailModalData.password}
            onChange={(e) => setEmailModalData({ ...emailModalData, password: e.target.value })}
            placeholder="Confirmez votre identité"
          />
        </form>
      </Modal>

      {/* Modal modification mot de passe */}
      <Modal
        isOpen={showPasswordModal}
        onClose={closePasswordModal}
        title="Modifier le mot de passe"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={closePasswordModal}
              className="px-5 py-3 bg-transparent border border-border rounded-lg text-text-secondary font-medium cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-text-primary"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="password-form"
              disabled={modalLoading}
              className="px-5 py-3 bg-gradient-to-br from-neon-cyan to-neon-purple border-none rounded-lg text-white font-semibold cursor-pointer transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_15px_rgba(0,240,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {modalLoading ? 'Modification...' : 'Modifier'}
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={handlePasswordChange}>
          {modalError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
              {modalError}
            </div>
          )}
          <FormInput
            label="Mot de passe actuel"
            type="password"
            name="currentPassword"
            value={passwordModalData.currentPassword}
            onChange={(e) => setPasswordModalData({ ...passwordModalData, currentPassword: e.target.value })}
            placeholder="Votre mot de passe actuel"
            className="mb-5"
          />
          <FormInput
            label="Nouveau mot de passe"
            type="password"
            name="newPassword"
            value={passwordModalData.newPassword}
            onChange={(e) => setPasswordModalData({ ...passwordModalData, newPassword: e.target.value })}
            placeholder="Minimum 6 caractères"
            className="mb-5"
          />
          <FormInput
            label="Confirmer le nouveau mot de passe"
            type="password"
            name="confirmPassword"
            value={passwordModalData.confirmPassword}
            onChange={(e) => setPasswordModalData({ ...passwordModalData, confirmPassword: e.target.value })}
            placeholder="Répétez le nouveau mot de passe"
          />
        </form>
      </Modal>
    </div>
  )
}

export default Profil
