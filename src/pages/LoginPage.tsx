import { useState } from 'react'
import { Eye, EyeOff, Boxes, LogIn, UserPlus } from '@/components/ui/Icons'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { FormGroup, Input, Label } from '@/components/ui/Form'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regNom, setRegNom] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await signIn(loginEmail.trim(), loginPassword)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else toast.success('Bienvenue !')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (regPassword !== regConfirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    if (regPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setLoading(true)
    const result = await signUp(regNom.trim(), regEmail.trim(), regPassword)
    setLoading(false)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Inscription réussie ! En attente d\'activation.')
      setTab('login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#667eea]/10 text-[#667eea]">
            <Boxes className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1a2332]">FreshStock</h2>
          <p className="text-sm text-slate-500">ERP de gestion d&apos;entrepôt</p>
          <p className="mt-1 text-xs text-slate-400">Inscription ouverte — un administrateur active votre compte</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${tab === 'login' ? 'bg-white text-[#667eea] shadow' : 'text-slate-500'}`}
          >
            <LogIn className="h-4 w-4" /> Connexion
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${tab === 'register' ? 'bg-white text-emerald-700 shadow' : 'text-slate-500'}`}
          >
            <UserPlus className="h-4 w-4" /> Inscription
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-1">
            <FormGroup>
              <Label>Email</Label>
              <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@freshstock.com" required />
            </FormGroup>
            <FormGroup>
              <Label>Mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormGroup>
            <Button type="submit" className="mt-4 w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-1">
            <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              Après inscription, connectez-vous une fois votre compte activé par un admin (onglet Utilisateurs).
            </p>
            <FormGroup>
              <Label>Nom complet</Label>
              <Input value={regNom} onChange={(e) => setRegNom(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
            </FormGroup>
            <FormGroup>
              <Label>Mot de passe</Label>
              <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} minLength={6} required />
            </FormGroup>
            <FormGroup>
              <Label>Confirmer</Label>
              <Input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} required />
            </FormGroup>
            <Button type="submit" variant="success" className="mt-4 w-full" disabled={loading}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
