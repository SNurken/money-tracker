import {
  LOAD_RECENT_TRANSACTIONS,
  LOAD_TRANSACTIONS_FAILURE,
  SAVE_TRANSACTION,
  loadRecentTransactions,
  saveExpenseTransaction,
  saveIncomeTransaction
} from './transactions'
import { mockStore, rejectPromise, resolvePromise } from '../util/test/helper'
import * as accounts from '../util/storage/accounts'
import * as transactions from '../util/storage/transactions'
import * as tags from '../util/storage/tags'
import { CHANGE_ACCOUNT_BALANCE } from './accounts'
import { USE_EXPENSE_TAG, USE_INCOME_TAG } from './tags'

let store

beforeEach(() => (store = mockStore()))

describe('loading recent transactions', () => {
  it('creates LOAD_RECENT_TRANSACTIONS action', () => {
    const expectedTransactions = [{ id: 'T12345' }, { id: 'T12346' }]
    transactions.retrieveRecentTransactions = jest.fn(
      resolvePromise(expectedTransactions)
    )

    return store.dispatch(loadRecentTransactions()).then(() => {
      const action = store
        .getActions()
        .find(action => action.type === LOAD_RECENT_TRANSACTIONS)
      expect(action.transactions).toEqual(expectedTransactions)
    })
  })

  it('creates LOAD_TRANSACTIONS_FAILURE when failed to load recent transactions', () => {
    const error = new Error()
    transactions.retrieveRecentTransactions = jest.fn(rejectPromise(error))

    return store.dispatch(loadRecentTransactions()).then(() => {
      expect(store.getActions()).toEqual([
        { type: LOAD_TRANSACTIONS_FAILURE, error }
      ])
    })
  })
})

describe('saving transaction', () => {
  it('creates SAVE_TRANSACTION action for expense', () => {
    Date.now = jest.fn(() => '67890')
    const expectedTransaction = {
      id: 'T67890',
      accountId: 'A12345',
      amount: -10000, // converted to cents and negative
      currency: 'USD',
      tags: ['foo'],
      date: '2017-06-22',
      note: 'text'
    }
    transactions.persistTransaction = jest.fn(resolvePromise(true))
    accounts.persistBalanceChange = jest.fn(resolvePromise(true))
    tags.increaseTagUsage = jest.fn(resolvePromise(true))

    return store
      .dispatch(
        saveExpenseTransaction({
          accountId: 'A12345',
          amount: 100,
          currency: 'USD',
          tags: ['foo'],
          date: '2017-06-22',
          note: 'text'
        })
      )
      .then(() => {
        expect(store.getActions()).toEqual([
          {
            type: SAVE_TRANSACTION,
            transaction: expectedTransaction
          },
          {
            type: CHANGE_ACCOUNT_BALANCE,
            id: 'A12345',
            currency: 'USD',
            amount: -10000
          },
          {
            type: USE_EXPENSE_TAG,
            tag: 'foo'
          }
        ])
      })
  })

  it('creates SAVE_TRANSACTION action for income', () => {
    Date.now = jest.fn(() => '67890')
    const expectedTransaction = {
      id: 'T67890',
      accountId: 'A12345',
      amount: 10000, // converted to cents and positive
      currency: 'USD',
      tags: ['foo'],
      date: '2017-06-22',
      note: 'text'
    }
    transactions.persistTransaction = jest.fn(resolvePromise(true))
    accounts.persistBalanceChange = jest.fn(resolvePromise(true))
    tags.increaseTagUsage = jest.fn(resolvePromise(true))

    return store
      .dispatch(
        saveIncomeTransaction({
          accountId: 'A12345',
          amount: 100,
          currency: 'USD',
          tags: ['foo'],
          date: '2017-06-22',
          note: 'text'
        })
      )
      .then(() => {
        expect(store.getActions()).toEqual([
          {
            type: SAVE_TRANSACTION,
            transaction: expectedTransaction
          },
          {
            type: CHANGE_ACCOUNT_BALANCE,
            id: 'A12345',
            currency: 'USD',
            amount: 10000
          },
          {
            type: USE_INCOME_TAG,
            tag: 'foo'
          }
        ])
      })
  })
})