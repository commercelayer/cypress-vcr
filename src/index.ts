import _ from 'lodash'

const requestsData: object[] = []
const allAlias: string[] = []
let currentFilename: string = 'requests'

type Routes = {
  method: string
  alias: string
  url: string
}

type SetRoutesParams = {
  endpoint: string
  routes: Routes[]
  record: boolean
  filename: string
}

type FixtureRequest = {
  url: string
  method: string
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
    if (!record) {
      currentFilename = filename || 'requests'
      cy.fixture(currentFilename).then((requests: FixtureRequest[]) => {
        const firstCalls = requests.filter(({ aliasRequest }) => !aliasRequest)
        firstCalls.map(({ url, method, data, alias }) => {
          cy.route({ url, method, response: data }).as(alias)
        })
      })
      return
    }
    routes.map(({ url, alias, method }) => {
      cy.route({
        url: `${endpoint}${url}`,
        method: method,
        onResponse: ({ url: requestUrl, method, response }) => {
          const data = response.body ? response.body : {}
          const filterAlias = allAlias.filter(a => a.search(alias) !== -1)
          const aliasIndex = allAlias.indexOf(alias)
          if (_.isEmpty(filterAlias)) {
            allAlias.push(alias)
            requestsData.push({
              url: requestUrl,
              method,
              data,
              alias,
              relativeUrl: url,
            })
          }
          if (filterAlias.length === 1) {
            const currentAlias = allAlias[aliasIndex]
            allAlias.push(`${currentAlias}${1}`)
            requestsData.push({
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
            allAlias.push(newAlias)
            requestsData.push({
              url: requestUrl,
              method,
              data,
              alias,
              aliasRequest: newAlias,
              relativeUrl: url,
            })
          }
        },
      }).as(alias)
    })
  }
)
Cypress.Commands.add('saveRequests', (filename = 'requests') => {
  const path = `./cypress/fixtures/${filename}.json`
  cy.writeFile(path, requestsData)
})

Cypress.Commands.add('newStubData', (findAlias, filename) => {
  const file = filename || currentFilename
  cy.fixture(file).then((requests: FixtureRequest[]) => {
    if (_.isArray(findAlias)) {
      findAlias.map(a => {
        const { method, data, url } = requests.find(
          ({ aliasRequest }) => aliasRequest === a
        ) as FixtureRequest
        cy.route({ url, method, response: data })
      })
    } else {
      const { method, data, url } = requests.find(
        ({ aliasRequest }) => aliasRequest === findAlias
      ) as FixtureRequest
      cy.route({ url, method, response: data })
    }
  })
})
