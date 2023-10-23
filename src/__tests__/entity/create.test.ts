import { errors } from '@/data/errors.js'
import { connect } from '@/factories/connect.js'
import { LocalWallet } from '@/wallets/local.js'

describe('entity.create', () => {
  beforeEach(async (ctx) => {
    const mnemonic = import.meta.env.VITE_TEST_MNEMONIC
    const wallet = LocalWallet.create(mnemonic)

    ctx.Buzz = await (await connect(wallet)).use('buzz')
  })

  test('cannot create a new buzz if it is not connected', async ({ Buzz }) => {
    Buzz.disconnect()

    expect(() =>
      Buzz.create({
        content: 'Hello World',
      })
    ).toThrow(errors.NOT_CONNECTED)
  })

  test.skip('can create a new buzz', async ({ Buzz }) => {
    expect(
      await Buzz.create({
        content: '2 step create',
      })
    ).toBeTypeOf('object')
  })

  test.todo('cannot create a new buzz if the root is not found')
})
