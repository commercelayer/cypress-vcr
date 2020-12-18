import _ from 'lodash'

type RequestsData = {
  [key: string]: object[]
}

type AllAlias = {
  [key: string]: string[]
}

const requestsData: RequestsData = {}
const allAlias: AllAlias = {}
let currentFilename: string = 'requests'

type Routes = {
  method: Method
  alias: string
  url: string
}

type SetRoutesParams = {
  endpoint: string
  routes: Routes[]
  record: boolean
  filename: string
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type FixtureRequest = {
  url: string
  method: Method
  data: object
  alias: string
  aliasRequest: string
}

export type SetRoutes = (params: SetRoutesParams) => void
export type NewStubData = (alias: string | string[], filename: string) => void
export type SaveRequests = (filename?: string) => void

Cypress.Commands.add(
  'setRoutes',
  ({ endpoint, routes, record, filename }: SetRoutesParams) => {
    currentFilename = filename || 'requests'
    if (_.isEmpty(requestsData[currentFilename])) {
      requestsData[currentFilename] = []
    }
    if (_.isEmpty(allAlias[currentFilename])) {
      allAlias[currentFilename] = []
    }
    if (!record) {
      cy.fixture(currentFilename).then((requests: FixtureRequest[]) => {
        const firstCalls = requests.filter(({ aliasRequest }) => !aliasRequest)
        firstCalls.map(({ url, method, data, alias }) => {
          cy.intercept(method, url, { body: data }).as(alias)
        })
      })
      return
    }
    routes.map(({ url, alias, method }) => {
      cy.intercept(method, `${endpoint}${url}`, req => {
        req.reply(res => {
          const data = res.body ? res.body : {}
          const requestUrl = res.url
          const filterAlias = allAlias[currentFilename].filter(
            a => a.search(alias) !== -1
          )
          const aliasIndex = allAlias[currentFilename].indexOf(alias)
          if (_.isEmpty(filterAlias)) {
            allAlias[currentFilename].push(alias)
            requestsData[currentFilename].push({
              url: requestUrl,
              method,
              data,
              alias,
              relativeUrl: url,
            })
          }
          if (filterAlias.length === 1) {
            const currentAlias = allAlias[currentFilename][aliasIndex]
            allAlias[currentFilename].push(`${currentAlias}${1}`)
            requestsData[currentFilename].push({
              url: requestUrl,
              method,
              data,
              alias,
              aliasRequest: `${currentAlias}${1}`,
              relativeUrl: url,
            })
          }
          if (filterAlias.length > 1) {
            const lastAlias = _.last(filterAlias) as string
            const lastNumber = lastAlias.substr(lastAlias.length - 1)
            const newAlias = lastAlias.replace(
              lastNumber,
              `${Number(lastNumber) + 1}`
            )
            allAlias[currentFilename].push(newAlias)
            requestsData[currentFilename].push({
              url: requestUrl,
              method,
              data,
              alias,
              aliasRequest: newAlias,
              relativeUrl: url,
            })
          }
        })
      }).as(alias)
    })
  }
)
Cypress.Commands.add('saveRequests', (filename = 'requests') => {
  const path = `./cypress/fixtures/${filename}.json`
  cy.writeFile(path, requestsData[filename])
})

Cypress.Commands.add('newStubData', (findAlias, filename) => {
  const file = filename || currentFilename
  cy.fixture(file).then((requests: FixtureRequest[]) => {
    if (_.isArray(findAlias)) {
      findAlias.map(a => {
        const { method, data, url } = requests.find(
          ({ aliasRequest }) => aliasRequest === a
        ) as FixtureRequest
        cy.intercept(method, url, { body: data })
      })
    } else {
      const { method, data, url } = requests.find(
        ({ aliasRequest }) => aliasRequest === findAlias
      ) as FixtureRequest
      cy.intercept(method, url, { body: data })
    }
  })
})
