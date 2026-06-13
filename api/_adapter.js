import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function netlifyToVercel(handler) {
  return async (req, res) => {
    const event = {
      httpMethod: req.method,
      body:
        req.method !== 'GET' && req.body != null
          ? typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body)
          : null,
      headers: req.headers,
    }

    const result = await handler(event, {})

    for (const [key, value] of Object.entries(result.headers || {})) {
      res.setHeader(key, value)
    }

    res.status(result.statusCode).end(result.body ?? '')
  }
}

export function loadHandler(path) {
  return require(path).handler
}
