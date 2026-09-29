import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { SEXES, useKeepAlive, useStats } from '../api.js'

const SIZE = 220
const RADIUS = 86
const STROKE = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3 // espace entre les deux segments

// Lien encodé dans le QR code. En local, "localhost" n'est pas joignable depuis
// un téléphone : définir VITE_PUBLIC_URL (ex. http://192.168.1.20:5173/) dans .env
const FORM_URL = `${import.meta.env.VITE_PUBLIC_URL || window.location.origin + window.location.pathname}#/parier`

export default function Results() {
  const { stats: raw, error } = useStats()
  useKeepAlive()
  const [active, setActive] = useState(null)

  if (!raw) {
    return <p className={error ? 'error center' : 'muted center'}>{error || 'Chargement…'}</p>
  }

  const { total } = raw
  const count = { garcon: raw.garcon.count, fille: raw.fille.count }
  const percent = { garcon: raw.garcon.percent, fille: raw.fille.percent }

  // Segments dessinés dans le sens horaire à partir du haut : garçon puis fille
  const bothPresent = count.garcon > 0 && count.fille > 0
  let offset = 0
  const segments = Object.keys(SEXES).map((key) => {
    const length = total ? (count[key] / total) * CIRCUMFERENCE : 0
    const segment = {
      key,
      dash: Math.max(0, length - (bothPresent ? GAP : 0)),
      offset,
    }
    offset += length
    return segment
  })

  return (
    <section className="results">
      <h1>Fille ou garçon ?</h1>

      <div className="donut-card">
        <div className="donut">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={`${count.garcon} paris garçon (${percent.garcon} %), ${count.fille} paris fille (${percent.fille} %)`}
          >
            <circle
              className="donut-track"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
            />
            {total > 0 &&
              segments.map((s) => (
                <circle
                  key={s.key}
                  className={`donut-segment ${s.key} ${active && active !== s.key ? 'dim' : ''}`}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  strokeWidth={STROKE}
                  strokeDasharray={`${s.dash} ${CIRCUMFERENCE - s.dash}`}
                  strokeDashoffset={-s.offset}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  onMouseEnter={() => setActive(s.key)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
          </svg>

          <div className="donut-center" aria-hidden="true">
            {active ? (
              <>
                <span className="value">{percent[active].toLocaleString('fr-FR')} %</span>
                <span className="caption">
                  {SEXES[active].label} · {count[active]}
                </span>
              </>
            ) : (
              <>
                <span className="value">{total}</span>
                <span className="caption">participant{total > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>

        <ul className="legend">
          {Object.entries(SEXES).map(([key, { label }]) => (
            <li
              key={key}
              onMouseEnter={() => setActive(key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className={`swatch ${key}`} />
              <span className="legend-label">{label}</span>
              <span className="legend-pct">{percent[key].toLocaleString('fr-FR')} %</span>
              <span className="legend-count">
                {count[key]} pari{count[key] > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <a className="qr" href="#/parier">
        <QRCodeSVG value={FORM_URL} size={132} marginSize={2} />
        <span>Scanne pour faire ton pronostic</span>
      </a>
    </section>
  )
}
