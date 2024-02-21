import { staticImplements } from '@/utils/index.js'
import type { MetaIDWalletForBtc, Transaction, WalletStatic } from './btcWallet.js'
import { TxComposer, mvc } from 'meta-contract'
import { errors } from '@/data/errors.js'
import { broadcast as broadcastToApi, batchBroadcast as batchBroadcastApi } from '@/service/mvc.js'
import { DERIVE_MAX_DEPTH } from '@/data/constants.js'

const request = {
  commitFeeRate: 1,
  revealFeeRate: 1,
  revealOutValue: 546,
  metaidDataList: [
    {
      operation: 'init',
      revealAddr: 'tb1pv3efxdwc2nkck5kg8updw62kxqt8mclshk3a2ywlazqa6n225n9qm9url7',
      version: '1.0.0',
    },
  ],
  changeAddress: 'tb1pv3efxdwc2nkck5kg8updw62kxqt8mclshk3a2ywlazqa6n225n9qm9url7',
}

@staticImplements<WalletStatic>()
export class MetaletWalletForBtc implements MetaIDWalletForBtc {
  public address: string
  public pub: string

  private internal: Window['metaidwallet']
  private constructor() {}

  static async create(): Promise<MetaIDWalletForBtc> {
    // if it's not in the browser, throw an error
    if (typeof window === 'undefined') {
      throw new Error(errors.NOT_IN_BROWSER)
    }

    // get xpub from metalet
    const pub: string = await window.metaidwallet.btc.getPublicKey()

    const wallet = new MetaletWalletForBtc()

    const { address } = await window.metaidwallet.btc.connect()

    wallet.address = address
    wallet.pub = pub
    wallet.internal = window.metaidwallet

    return wallet
  }

  public hasAddress() {
    return !!this.address
  }

  public async getAddress({ path }: { path?: string }) {
    if (!path) return this.address

    return await this.internal.btc.getAddress()
  }

  public async inscribe({ data, options }: { data: any; options?: { noBroadcast: boolean } }): Promise<any> {
    return await this.internal.btc.inscribe({ data, options })
  }

  public async getPublicKey(path: string = '/0/0') {
    return await this.internal.btc.getPublicKey()
  }

  public async getBalance() {
    return await this.internal.btc.getBalance()
  }

  public async signMessage(message): Promise<string> {
    const signature = await this.internal.btc.signMessage(message)
    return signature
  }

  public async signPsbt(psbtHex: string, options?: any): Promise<string> {
    return await this.internal.btc.signPsbt({ psbtHex, options })
  }

  public async broadcast(txComposer: TxComposer): Promise<{ txid: string }> {
    // broadcast locally first
    const txHex = txComposer.getTx().toString()
    return await broadcastToApi({ txHex })
  }

  public async batchBroadcast(txComposer: TxComposer[]): Promise<{ txid: string }[]> {
    // broadcast locally first
    const hexs = txComposer.map((d) => {
      return { hex: d.getTx().toString() }
    })
    return await batchBroadcastApi(hexs)
  }
}
