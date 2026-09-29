import { useState } from 'react'
import { SEXES, resetPredictions, useVoters } from '../api.js'

const TOKEN_KEY = 'gender-reveal-admin-token'

const FILTERS = [
  { key: 'all', label: 'Tous' },
  ...Object.entries(SEXES).map(([key, { label }]) => ({ key, label })),
]

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export default function Admin() {
  const { voters, error } = useVoters()
  const [filter, setFilter] = useState('all')
  const [token, setToken] = useState(readToken)
  const [reset, setReset] = useState({ status: 'idle', message: '' })

  const counts = Object.fromEntries(
    FILTERS.map(({ key }) => [
      key,
      voters?.filter((v) => key === 'all' || v.prediction === SEXES[key].value).length ?? 0,
    ]),
  )
  const shown = (voters ?? [])
    .map((v, i) => ({ ...v, rank: i + 1 }))
    .filter((v) => filter === 'all' || v.prediction === SEXES[filter].value)
    .reverse() // plus récents en premier

  async function onReset(e) {
    e.preventDefault()
    if (!window.confirm('Supprimer toutes les prédictions ? Cette action est irréversible.')) {
      return
    }
    setReset({ status: 'sending', message: '' })
    try {
      const { deleted } = await resetPredictions(token.trim())
      try {
        sessionStorage.setItem(TOKEN_KEY, token.trim())
      } catch {
        /* stockage indisponible */
      }
      setReset({
        status: 'done',
        message: `${deleted} prédiction${deleted > 1 ? 's' : ''} supprimée${deleted > 1 ? 's' : ''}.`,
      })
    } catch (err) {
      setReset({ status: 'error', message: err.message })
    }
  }

  return (
    <section className="admin">
      <h1>Administration</h1>

      <div className="panel">
        <div className="panel-head">
          <h2>Participants</h2>
          <div className="filters" role="group" aria-label="Filtrer par pronostic">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`filter ${key} ${filter === key ? 'active' : ''}`}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label} <span className="filter-count">{counts[key]}</span>
              </button>
            ))}
          </div>
        </div>

        {!voters ? (
          <p className={error ? 'error' : 'muted'}>{error || 'Chargement…'}</p>
        ) : shown.length === 0 ? (
          <p className="muted">Aucun participant pour l'instant.</p>
        ) : (
          <table className="voters">
            <thead>
              <tr>
                <th className="num">#</th>
                <th>Prénom</th>
                <th>Nom</th>
                <th>Pronostic</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((v) => {
                const key = v.prediction === SEXES.fille.value ? 'fille' : 'garcon'
                return (
                  <tr key={v.rank}>
                    <td className="num muted">{v.rank}</td>
                    <td>{v.prenom}</td>
                    <td>{v.nom}</td>
                    <td>
                      <span className={`tag ${key}`}>{SEXES[key].label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <form className="panel danger-zone" onSubmit={onReset}>
        <h2>Réinitialiser la base</h2>
        <p className="muted">
          Supprime toutes les prédictions. Le jeton est la variable <code>ADMIN_TOKEN</code>{' '}
          du serveur.
        </p>
        <div className="reset-row">
          <input
            type="password"
            required
            placeholder="Jeton admin"
            aria-label="Jeton admin"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button className="danger" disabled={reset.status === 'sending'}>
            {reset.status === 'sending' ? 'Suppression…' : 'Tout supprimer'}
          </button>
        </div>
        {reset.message && (
          <p className={reset.status === 'error' ? 'error' : 'success'}>{reset.message}</p>
        )}
      </form>
    </section>
  )
}
