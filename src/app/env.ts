import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:8088'),
  VITE_ENABLE_DEMO_PAYMENT: z.string().optional(),
})

const parseEnv = () => {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    console.error('Invalid environment variables:', error)
    return {
      VITE_API_URL: 'http://localhost:8088',
      VITE_ENABLE_DEMO_PAYMENT: undefined,
    }
  }
}

const parsed = parseEnv()

/** Demo deposit chỉ bật ở DEV, hoặc khi VITE_ENABLE_DEMO_PAYMENT=true. Prod mặc định tắt. */
const enableDemoPayment =
  parsed.VITE_ENABLE_DEMO_PAYMENT === 'true' ||
  (parsed.VITE_ENABLE_DEMO_PAYMENT !== 'false' && import.meta.env.DEV === true)

export const env = {
  VITE_API_URL: parsed.VITE_API_URL,
  enableDemoPayment,
}
