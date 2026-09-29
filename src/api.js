import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

// URL du serveur (REST + Socket.io), définie dans .env : VITE_API_URL=http://localhost:3000
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '')

// Clé = nom du champ dans les stats de l'API, value = valeur attendue par POST /api/predictions
export const SEXES = {
  garcon: { label: 'Garçon', value: 'GARCON' },
  fille: { label: 'Fille', value: 'FILLE' },
}

async function request(path, options) {
  let data
  try {
    const res = await fetch(`${API_URL}/api${path}`, options)
    data = await res.json()
  } catch {
    throw new Error('Impossible de joindre le serveur.')
  }
  if (!data.ok) throw new Error(data.message || 'Erreur serveur')
  return data
}

/** Envoie une prédiction : { email, nom, prenom, prediction: 'GARCON' | 'FILLE' } */
export function submitPrediction(prediction) {
  return request('/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prediction),
  })
}

const KEEP_ALIVE_MIN_MS = 10 * 60 * 1000
const KEEP_ALIVE_MAX_MS = 14 * 60 * 1000

/**
 * Envoie une requête à l'API à intervalle aléatoire (entre 10 et 14 min)
 * pour empêcher l'hébergement gratuit de la mettre en veille.
 */
export function useKeepAlive() {
  useEffect(() => {
    let timer

    const schedule = () => {
      const delay = KEEP_ALIVE_MIN_MS + Math.random() * (KEEP_ALIVE_MAX_MS - KEEP_ALIVE_MIN_MS)
      timer = setTimeout(async () => {
        try {
          await request('/stats')
        } catch {
          // Serveur injoignable : on réessaie au prochain tour
        }
        schedule()
      }, delay)
    }

    schedule()
    return () => clearTimeout(timer)
  }, [])
}

/** Vide la table des prédictions. `token` = ADMIN_TOKEN du serveur. */
export function resetPredictions(token) {
  return request('/predictions', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

/**
 * Liste des votants [{ nom, prenom, prediction }] (sans email), du plus ancien
 * au plus récent, mise à jour en direct via Socket.io.
 */
export function useVoters() {
  const [voters, setVoters] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    request('/voters')
      .then((data) => active && setVoters(data.voters))
      .catch((err) => active && setError(err.message))

    const socket = io(API_URL)
    socket.on('newPrediction', (vote) => setVoters((list) => [...(list ?? []), vote]))
    socket.on('reset', () => setVoters([]))

    return () => {
      active = false
      socket.disconnect()
    }
  }, [])

  return { voters, error }
}

/**
 * Statistiques { total, garcon: { count, percent }, fille: { count, percent } },
 * mises à jour en direct via Socket.io. `stats` vaut null pendant le chargement.
 */
export function useStats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    // Chargement initial en REST (le socket renvoie aussi les stats à la connexion)
    request('/stats')
      .then((data) => active && setStats(data.stats))
      .catch((err) => active && setError(err.message))

    const socket = io(API_URL)
    socket.on('stats', (data) => {
      setStats(data)
      setError(null)
    })

    return () => {
      active = false
      socket.disconnect()
    }
  }, [])

  return { stats, error }
}
