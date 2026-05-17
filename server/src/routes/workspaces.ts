import { Router, type Response } from 'express'
import {
  createNamedWorkspaceCheckpoint,
  deleteWorkspaceCheckpoint,
  findWorkspaceSnapshot,
  validateHistorySnapshotIntegrity,
  listWorkspaceCheckpoints,
  listWorkspaceCommands,
  loadWorkspaceHistory,
  createReplayWindow,
  appendWorkspaceOperation,
  listWorkspaceOperationsBySession,
  listWorkspaceOperationsByAuthor,
} from '../services/workspaceHistoryStore.js'
import {
  deleteWorkspace,
  getWorkspaceVersion,
  listWorkspaces,
  loadWorkspace,
  saveWorkspace,
} from '../services/workspaceStore.js'
import type { WorkspaceDocument } from '../types/workspaceDocument.js'
import { validateWorkspaceDocument } from '../validation/workspaceValidation.js'

export const workspacesRouter = Router()

function validationError(errors: string[], warnings: string[]) {
  return { error: { type: 'validation_error', message: 'Workspace document failed validation.', details: errors }, warnings }
}

function notFound(workspaceId: string) {
  return { error: { type: 'not_found', message: `Workspace ${workspaceId} was not found.` } }
}

async function validateAndSaveWorkspace(document: WorkspaceDocument, warnings: string[], status: number, response: Response) {
  const summary = await saveWorkspace(document, { rejectStale: true })
  response.status(status).json({
    document: (await loadWorkspace(document.workspaceId)) ?? document,
    summary,
    warnings,
  })
}

workspacesRouter.get('/', async (_request, response, next) => {
  try {
    response.json({ workspaces: await listWorkspaces() })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/', async (request, response, next) => {
  try {
    const validation = validateWorkspaceDocument(request.body)
    if (!validation.valid) {
      response.status(400).json(validationError(validation.errors, validation.warnings))
      return
    }

    const document = request.body as WorkspaceDocument
    await validateAndSaveWorkspace(document, validation.warnings, 201, response)
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/import', async (request, response, next) => {
  try {
    const validation = validateWorkspaceDocument(request.body)
    if (!validation.valid) {
      response.status(400).json(validationError(validation.errors, validation.warnings))
      return
    }

    const document = request.body as WorkspaceDocument
    await validateAndSaveWorkspace(document, validation.warnings, 201, response)
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json({ document })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.put('/:id', async (request, response, next) => {
  try {
    const body = request.body as WorkspaceDocument
    if (body.workspaceId && body.workspaceId !== request.params.id) {
      response.status(400).json({
        error: {
          type: 'validation_error',
          message: `Body workspaceId "${body.workspaceId}" does not match URL parameter "${request.params.id}".`,
        },
      })
      return
    }

    const validation = validateWorkspaceDocument(body)
    if (!validation.valid) {
      response.status(400).json(validationError(validation.errors, validation.warnings))
      return
    }

    const document = { ...body, workspaceId: request.params.id }
    await validateAndSaveWorkspace(document, validation.warnings, 200, response)
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/:id/save', async (request, response, next) => {
  try {
    const validation = validateWorkspaceDocument(request.body)
    if (!validation.valid) {
      response.status(400).json(validationError(validation.errors, validation.warnings))
      return
    }

    const document = { ...(request.body as WorkspaceDocument), workspaceId: request.params.id }
    await validateAndSaveWorkspace(document, validation.warnings, 200, response)
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/version', async (request, response, next) => {
  try {
    const version = await getWorkspaceVersion(request.params.id)
    if (!version) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json(version)
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/history', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json({ history: await loadWorkspaceHistory(request.params.id) })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/commands', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    const offset = request.query.offset ? Number(request.query.offset) : undefined
    const limit = request.query.limit ? Number(request.query.limit) : undefined
    response.json(await listWorkspaceCommands(request.params.id, { offset, limit }))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/:id/operations', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    const body = request.body as Partial<import('../types/workspaceHistory.js').WorkspaceCommandLogEntry>
    if (!body.commandId || !body.commandType || typeof body.timestamp !== 'number') {
      response.status(400).json(validationError(['commandId, commandType, and timestamp are required.'], []))
      return
    }
    const history = await appendWorkspaceOperation(request.params.id, {
      id: body.id ?? `workspace-command-log:${crypto.randomUUID()}`,
      workspaceId: request.params.id,
      commandId: body.commandId,
      commandType: body.commandType,
      timestamp: body.timestamp,
      payload: body.payload ?? {},
      operation: body.operation,
    })
    response.status(201).json({ operation: history.commandLog.at(-1), total: history.commandLog.length })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/operations', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json(await listWorkspaceCommands(request.params.id, {
      offset: request.query.offset ? Number(request.query.offset) : undefined,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
    }))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/operations/session/:sessionId', async (request, response, next) => {
  try {
    response.json(await listWorkspaceOperationsBySession(request.params.id, request.params.sessionId))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/operations/author/:authorId', async (request, response, next) => {
  try {
    response.json(await listWorkspaceOperationsByAuthor(request.params.id, request.params.authorId))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/commands/range', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json(await listWorkspaceCommands(request.params.id, {
      start: request.query.start ? Number(request.query.start) : undefined,
      end: request.query.end ? Number(request.query.end) : undefined,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
    }))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/replay', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json(await createReplayWindow(
      request.params.id,
      request.query.target ? Number(request.query.target) : undefined,
    ))
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/replay/checkpoints', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json({ checkpoints: await listWorkspaceCheckpoints(request.params.id) })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/checkpoints', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json({ checkpoints: await listWorkspaceCheckpoints(request.params.id) })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/:id/checkpoints', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    const snapshotId = typeof request.body?.snapshotId === 'string' ? request.body.snapshotId : undefined
    if (!snapshotId) {
      response.status(400).json(validationError(['snapshotId is required.'], []))
      return
    }
    const snapshot = await findWorkspaceSnapshot(request.params.id, snapshotId)
    if (!snapshot) {
      response.status(400).json(validationError([`Snapshot ${snapshotId} was not found.`], []))
      return
    }
    const checkpoint = await createNamedWorkspaceCheckpoint({
      workspaceId: request.params.id,
      workspaceVersion: document.version,
      snapshotId,
      name: typeof request.body?.name === 'string' ? request.body.name : 'Workspace checkpoint',
      description: typeof request.body?.description === 'string' ? request.body.description : undefined,
      commandDepth: typeof request.body?.commandDepth === 'number' ? request.body.commandDepth : undefined,
    })
    response.status(201).json({ checkpoint })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.post('/:id/restore', async (request, response, next) => {
  try {
    const snapshotId = typeof request.body?.snapshotId === 'string' ? request.body.snapshotId : undefined
    if (!snapshotId) {
      response.status(400).json(validationError(['snapshotId is required.'], []))
      return
    }
    const snapshot = await findWorkspaceSnapshot(request.params.id, snapshotId)
    if (!snapshot) {
      response.status(400).json(validationError([`Snapshot ${snapshotId} was not found.`], []))
      return
    }
    const integrity = validateHistorySnapshotIntegrity(snapshot)
    if (!integrity.valid) {
      response.status(400).json(validationError(integrity.errors, []))
      return
    }
    const current = await loadWorkspace(request.params.id)
    const document = {
      ...(snapshot.document as WorkspaceDocument),
      workspaceId: request.params.id,
      version: (current?.version ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    const validation = validateWorkspaceDocument(document)
    if (!validation.valid) {
      response.status(400).json(validationError(validation.errors, validation.warnings))
      return
    }
    const summary = await saveWorkspace(document, { rejectStale: false })
    response.json({
      document: (await loadWorkspace(request.params.id)) ?? document,
      summary,
      restoredFromSnapshotId: snapshotId,
      restoreIntegrity: { checksum: integrity.checksum },
    })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.delete('/:id/checkpoints/:checkpointId', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    const result = await deleteWorkspaceCheckpoint(request.params.id, request.params.checkpointId)
    if (result.protected) {
      response.status(409).json({
        error: {
          type: 'validation_error',
          message: 'Protected recovery checkpoints cannot be deleted.',
          details: [request.params.checkpointId],
        },
      })
      return
    }
    if (!result.deleted) {
      response.status(404).json({ error: { type: 'not_found', message: 'Checkpoint was not found.' } })
      return
    }
    response.json({ checkpointId: request.params.checkpointId, deleted: true })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.delete('/:id', async (request, response, next) => {
  try {
    await deleteWorkspace(request.params.id)
    response.json({ workspaceId: request.params.id })
  } catch (error) {
    next(error)
  }
})

workspacesRouter.get('/:id/export', async (request, response, next) => {
  try {
    const document = await loadWorkspace(request.params.id)
    if (!document) {
      response.status(404).json(notFound(request.params.id))
      return
    }
    response.json({ document, json: JSON.stringify(document, null, 2) })
  } catch (error) {
    next(error)
  }
})
