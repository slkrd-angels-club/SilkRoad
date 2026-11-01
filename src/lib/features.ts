/**
 * Feature switches, read at build time from Vercel environment variables.
 *
 * VITE_ENABLE_AI=true turns on the site chat assistant and the instant AI
 * pre-screen of founder applications. Both also need ANTHROPIC_API_KEY on the
 * server. Change the variable in Vercel and redeploy to switch.
 */
export const AI_ENABLED = import.meta.env.VITE_ENABLE_AI === 'true'
