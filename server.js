/*
 * Copyright (c) 2023 VMware, Inc. or its affiliates
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path')
const otelEnabled = "true" === (process.env.OTEL_ENABLED || "false")
if (otelEnabled) {
  require(path.join(__dirname, '/otel.js'))
}

const express = require('express')
const mustacheExpress = require('mustache-express')
const app = express()
const fs = require('fs')
const dir = require('node-dir')

// Configure Express with Mustache support.
app.engine('mustache', mustacheExpress())
app.set('view engine', 'mustache')
app.set('views', path.join(__dirname, '/views'))

// Load custom configuration.
const config = {
  backendBaseUrl: "",
}
// Use Service Binding configuration if available.
if (process.env.SERVICE_BINDING_ROOT) {
  const bindingRootPath = process.env.SERVICE_BINDING_ROOT
  if (fs.existsSync(bindingRootPath)) {
    dir.readFiles(bindingRootPath, {
      match: /type/, exclude: /^\./
      }, function(err, content, next) {
          if (err) throw err;
          next();
      }, function(err, files) {
          if (err) throw err;
          files.map(file => path.dirname(file)).forEach(function(configDir) {
            const typeFile = path.join(configDir, "type")
            const type = fs.readFileSync(typeFile)
            if (type == "config") {
              if (!path.basename(configDir).startsWith("..")) {
                console.log(`Loading configuration from Service Binding dir: ${configDir}`)
                dir.readFiles(configDir, {
                  match: /./, exclude: /type/
                  }, function(err, content, next) {
                      if (err) throw err;
                      next();
                  }, function(err, files) {
                      if (err) throw err;
                      files.forEach(function(file) {
                        const key = path.basename(file)
                        if (!key.startsWith("..")) {
                          const value = fs.readFileSync(file)
                          config[key] = value.toString()
                        }
                      })
                  });
              }
            }
          })
      });
  }
}

// Serve index page.
app.get('/', (req, res) => {
  const values = {}
  if (config['motd.title']) {
    values.title = config['motd.title']
  }
  res.render('index', values)
})

// When running in Kubernetes, we share a single ingress for frontend and backend.
// When running on a local workstation, the backend is running as a distinct process.
if (process.env.MOTD_SERVICES_BACKEND) {
  config.backendBaseUrl = process.env.MOTD_SERVICES_BACKEND
}
const configStr = "const config = " + JSON.stringify(config) + ";"

// Serve config page.
app.get('/js/config.js', (req, res) => {
  res.type('json')
  res.send(configStr)
})

// Set up health check endpoint.
app.get('/health', (req, res) => {
  res.send('UP')
})

// Set up static content.
app.use('/css/bootstrap.min.css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css')))
app.use('/css/bootstrap.min.css.map', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css.map')))
app.use('/js/bootstrap.bundle.min.js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js')))
app.use('/js/bootstrap.bundle.min.js.map', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js.map')))
app.use('/js/jquery.slim.min.js', express.static(path.join(__dirname, 'node_modules/jquery/dist/jquery.slim.min.js')))
app.use('/js/jquery.slim.min.map', express.static(path.join(__dirname, 'node_modules/jquery/dist/jquery.slim.min.map')))
app.use('/js/axios.min.js', express.static(path.join(__dirname, 'node_modules/axios/dist/axios.min.js')))
app.use('/js/axios.min.js.map', express.static(path.join(__dirname, 'node_modules/axios/dist/axios.min.js.map')))
app.use('/css/gh-fork-ribbon.css', express.static(path.join(__dirname, 'node_modules/github-fork-ribbon-css/gh-fork-ribbon.css')))
app.use(express.static(path.join(__dirname, 'public')))

// Start the HTTP server.
const port = parseInt(process.env.PORT || "8080")
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

process.on('SIGTERM', () => {
  server.close()
})
