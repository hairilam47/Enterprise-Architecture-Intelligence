import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { workspacesRouter } from './routes/workspaces.js'

const app = express()
const port = Number(process.env.PORT ?? 8787)

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

app.use((request, response, next) => {
  const startedAt = Date.now()
  response.on('finish', () => {
    console.info(JSON.stringify({
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }))
  })
  next()
})

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'enterprise-architecture-intelligence-api',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/workspaces', workspacesRouter)

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error)
  const status = typeof error?.status === 'number' ? error.status : 500
  response.status(status).json({
    error: {
      type: typeof error?.type === 'string' ? error.type : 'storage_error',
      message: error instanceof Error ? error.message : 'Backend request failed.',
      details: Array.isArray(error?.details) ? error.details : error instanceof Error ? [error.message] : [],
    },
  })
}

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Enterprise Architecture Intelligence API listening on http://127.0.0.1:${port}`)
})
