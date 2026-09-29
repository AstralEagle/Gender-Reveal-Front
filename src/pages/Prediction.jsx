import { useState } from 'react'
import { SEXES, submitPrediction } from '../api.js'

const EMPTY = { email: '', prenom: '', nom: '', sex: '' }

export default function Prediction() {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function onSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      await submitPrediction({
        email: form.email.trim(),
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        prediction: SEXES[form.sex].value,
      })
      setStatus('sent')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <section className="form-card center">
        <h1>Merci {form.prenom} !</h1>
        <p>
          Ton pronostic <strong>{SEXES[form.sex].label}</strong> est bien enregistré.
        </p>
      </section>
    )
  }

  return (
    <section className="form-card">
      <h1>Ton pronostic</h1>
      <p className="muted">Fille ou garçon ? À toi de jouer.</p>

      <form onSubmit={onSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Prénom</span>
            <input
              required
              autoComplete="given-name"
              value={form.prenom}
              onChange={update('prenom')}
            />
          </label>
          <label className="field">
            <span>Nom</span>
            <input
              required
              autoComplete="family-name"
              value={form.nom}
              onChange={update('nom')}
            />
          </label>
        </div>

        <fieldset className="field">
          <legend>Sexe</legend>
          <div className="sex-options">
            {Object.entries(SEXES).map(([key, { label }]) => (
              <label key={key} className={`sex-option ${key}`}>
                <input
                  type="radio"
                  name="sex"
                  value={key}
                  required
                  checked={form.sex === key}
                  onChange={update('sex')}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {status === 'error' && (
          <p className="error">{error}</p>
        )}

        <button className="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Envoi…' : 'Envoyer mon pronostic'}
        </button>
      </form>
    </section>
  )
}
