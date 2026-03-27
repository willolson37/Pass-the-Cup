import { useState } from 'react'

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="8" fill="#dcfce7" />
    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function PricingScreen({ user, onBack, onSuccess }) {
  const [loadingPrice, setLoadingPrice] = useState(null)
  const [error, setError] = useState('')

  const handleCheckout = async (priceId) => {
    setError('')
    setLoadingPrice(priceId)

    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
          successUrl: window.location.origin + '/?payment=success',
          cancelUrl: window.location.origin + '/',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Checkout failed')
      }

      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoadingPrice(null)
    }
  }

  const singleGamePriceId = import.meta.env.VITE_STRIPE_SINGLE_GAME_PRICE_ID
  const seasonPassPriceId = import.meta.env.VITE_STRIPE_SEASON_PASS_PRICE_ID

  return (
    <div className="screen pricing-screen">
      <div className="screen-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          ← Not now
        </button>
      </div>

      <div className="pricing-header">
        <h2 className="auth-title">Unlock Live Mode</h2>
        <p className="auth-subtitle">Follow along with any live MLB game</p>
      </div>

      {error && <p className="auth-error" style={{ textAlign: 'center', marginBottom: 12 }}>{error}</p>}

      <div className="pricing-cards">
        {/* Single Game */}
        <div className="pricing-card">
          <div className="pricing-card-title">Single Game</div>
          <div className="pricing-price">$0.99</div>
          <div className="pricing-period">One live game</div>
          <ul className="pricing-features">
            <li className="pricing-feature"><CheckIcon /> One game credit</li>
            <li className="pricing-feature"><CheckIcon /> Good for trying it out</li>
            <li className="pricing-feature"><CheckIcon /> Casual use</li>
          </ul>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loadingPrice !== null}
            onClick={() => handleCheckout(singleGamePriceId)}
          >
            {loadingPrice === singleGamePriceId ? (
              <span className="auth-spinner" />
            ) : (
              'Buy for $0.99'
            )}
          </button>
        </div>

        {/* Season Pass */}
        <div className="pricing-card featured">
          <div className="pricing-best-value">BEST VALUE</div>
          <div className="pricing-card-title">Season Pass</div>
          <div className="pricing-price pricing-price-green">$15</div>
          <div className="pricing-period">Full MLB season</div>
          <ul className="pricing-features">
            <li className="pricing-feature"><CheckIcon /> April through World Series</li>
            <li className="pricing-feature"><CheckIcon /> Unlimited games</li>
            <li className="pricing-feature"><CheckIcon /> Best value</li>
          </ul>
          <button
            className="btn"
            style={{ width: '100%', background: '#22c55e', color: '#fff' }}
            disabled={loadingPrice !== null}
            onClick={() => handleCheckout(seasonPassPriceId)}
          >
            {loadingPrice === seasonPassPriceId ? (
              <span className="auth-spinner" />
            ) : (
              'Buy Season Pass'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
