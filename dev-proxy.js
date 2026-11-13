const http = require('http')

const METRO_PORT = 8082
const PROXY_PORT = 8081

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  }

  const proxy = http.request(options, (metroRes) => {
    const ct = metroRes.headers['content-type'] || ''
    const isHtml = ct.includes('text/html')

    if (!isHtml) {
      clientRes.writeHead(metroRes.statusCode, metroRes.headers)
      metroRes.pipe(clientRes)
      return
    }

    const chunks = []
    metroRes.on('data', (c) => chunks.push(c))
    metroRes.on('end', () => {
      let html = Buffer.concat(chunks).toString('utf-8')
      html = html.replace(/src="\//g, 'src="')
      html = html.replace(/href="\//g, 'href="')
      const headers = { ...metroRes.headers }
      headers['content-length'] = Buffer.byteLength(html)
      clientRes.writeHead(metroRes.statusCode, headers)
      clientRes.end(html)
    })
  })

  proxy.on('error', (err) => {
    clientRes.writeHead(502, { 'Content-Type': 'text/plain' })
    clientRes.end('Metro not ready: ' + err.message)
  })

  clientReq.pipe(proxy)
})

server.listen(PROXY_PORT, () => {
  console.log(`Proxy listening on http://localhost:${PROXY_PORT} → Metro on ${METRO_PORT}`)
})
