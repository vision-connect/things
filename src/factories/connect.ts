import type { MetaIDWalletForMvc } from '@/wallets/metalet/mvcWallet.js'
import type { MetaIDWalletForBtc } from '@/wallets/metalet/btcWallet.js'

import { MvcConnector as _MvcConnector } from '@/core/connector/mvc.js'
import { BtcConnector as _BtcConnector } from '@/core/connector/btc.js'

import type { MvcConnector } from '@/core/connector/mvc.js'
import type { BtcConnector } from '@/core/connector/btc.js'

export async function mvcConnect(wallet?: MetaIDWalletForMvc): Promise<MvcConnector> {
  return await _MvcConnector.create(wallet)
}

export async function btcConnect(wallet?: MetaIDWalletForBtc): Promise<BtcConnector> {
  return await _BtcConnector.create(wallet)
}
