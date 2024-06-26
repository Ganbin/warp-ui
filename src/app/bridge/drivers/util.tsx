import * as GreenWeb from 'greenwebjs';
import { getBLSModule } from "clvm";

export function stringToHex(str: string): string {
    return str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}


export function hexToString(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
    }
    return str;
}


export async function buildSpendBundle(
  coinSpends: InstanceType<typeof GreenWeb.CoinSpend>[],
  sigs: string[]
): Promise<InstanceType<typeof GreenWeb.util.serializer.types.SpendBundle>> {
  const { AugSchemeMPL, G2Element } = getBLSModule();

  const sb = new GreenWeb.util.serializer.types.SpendBundle();
  sb.coinSpends = coinSpends;
  sb.aggregatedSignature = Buffer.from(
    AugSchemeMPL.aggregate(
      sigs.map((sig) => G2Element.from_bytes(Buffer.from(sig, "hex")))
    ).serialize()
  ).toString("hex");

  return sb;
}
