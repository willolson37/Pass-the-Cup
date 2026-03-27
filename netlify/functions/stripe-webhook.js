const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = event.headers['stripe-signature']
  const rawBody = event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const { userId, priceId } = session.metadata

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    if (priceId === process.env.STRIPE_SEASON_PASS_PRICE_ID) {
      const currentYear = new Date().getFullYear()
      const seasonExpires = new Date(`${currentYear}-11-30T23:59:59Z`)

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: 'season',
          season_expires_at: seasonExpires.toISOString(),
        })
        .eq('id', userId)

      if (error) {
        console.error('Supabase update error (season):', error)
      }
    } else {
      // Single game: increment game_credits by 1
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('game_credits, plan')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError)
      } else {
        const updates = {
          game_credits: (profile.game_credits || 0) + 1,
        }
        if (profile.plan !== 'season') {
          updates.plan = 'game'
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)

        if (updateError) {
          console.error('Supabase update error (game):', updateError)
        }
      }
    }
  }

  return { statusCode: 200, body: 'OK' }
}
