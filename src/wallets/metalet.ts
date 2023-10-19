import { staticImplements } from "@/utils/index.ts";
import { MetaIDConnectWallet, WalletStatic } from "./wallet.ts";
import { TxComposer, mvc } from "meta-contract";
import { errors } from "@/data/errors.ts";
import { broadcast as broadcastToApi } from "@/api.ts";
import { DERIVE_MAX_DEPTH } from "@/data/constants.ts";

@staticImplements<WalletStatic>()
export class MetaletWallet implements MetaIDConnectWallet {
  public address: string | undefined;
  public xpub: string | undefined;
  private internal: any;

  private constructor() {}

  static async create(): Promise<any> {
    // if it's not in the browser, throw an error
    if (typeof window === "undefined") {
      throw new Error(errors.NOT_IN_BROWSER);
    }

    const { address } = await window.metaidwallet.connect();

    // get xpub from metalet
    const xpub: string = await window.metaidwallet.getXPublicKey();

    const wallet = new MetaletWallet();
    wallet.address = address;
    wallet.xpub = xpub;
    wallet.internal = window.metaidwallet;

    return wallet;
  }

  public hasAddress() {
    return !!this.address;
  }

  public async getAddress(path?: string) {
    if (!path) return this.address;

    // cut the first slash for compatibility
    return await this.internal.getAddress(path.slice(1));
  }

  public async getPublicKey(path: string = "/0/0") {
    // cut the first slash for compatibility
    return await this.internal.getPublicKey(path.slice(1));
  }

  public async signMessage(message, encoding): Promise<string> {
    const { signature } = await this.internal.signMessage({
      message,
      encoding,
    });
    return signature.signature;
  }

  public async signInput({
    txComposer,
    inputIndex,
  }: {
    txComposer: TxComposer;
    inputIndex: number;
  }) {
    // get input's address
    console.log({
      inputIndex,
      output0: txComposer.getInput(0).output,
      output1: txComposer.getInput(1).output,
    });
    const outputScript = txComposer.getInput(inputIndex).output.script;
    const address = outputScript.toAddress().toString();

    // get xpub from metalet
    const xpubObj = mvc.HDPublicKey.fromString(this.xpub);
    // loop through the path and derive the private key
    let deriver = 0;
    let toUsePath: string;
    while (deriver < DERIVE_MAX_DEPTH) {
      const childAddress = xpubObj
        .deriveChild(0)
        .deriveChild(deriver)
        .publicKey.toAddress("mainnet" as any)
        .toString();

      if (childAddress === address) {
        toUsePath = `0/${deriver}`;
        break;
      }

      deriver++;
    }
    if (!toUsePath) throw new Error(errors.CANNOT_DERIVE_PATH);

    // cut the first slash for compatibility
    const { signedTransactions } = await this.internal.signTransactions({
      transactions: [
        {
          txHex: txComposer.getTx().toString(),
          inputIndex,
          address,
          scriptHex: outputScript.toHex(),
          path: toUsePath,
          sigtype: 0xc1,
        },
      ],
    });

    // update the txComposer
    const signedTx = new mvc.Transaction(signedTransactions[0].txHex);
    console.log({ signedTx });

    return new TxComposer(signedTx);
  }

  public async send(
    toAddress: string,
    amount: number
  ): Promise<{
    txid: string;
  }> {
    const sendRes = await this.internal.transfer({
      tasks: [
        {
          receivers: [
            {
              address: toAddress,
              amount,
            },
          ],
        },
      ],
    });

    return {
      txid: sendRes.txids[0],
    };
  }

  public async broadcast(txComposer: TxComposer): Promise<{ txid: string }> {
    // broadcast locally first
    const txHex = txComposer.getTx().toString();

    return await broadcastToApi({ txHex });
  }
}
