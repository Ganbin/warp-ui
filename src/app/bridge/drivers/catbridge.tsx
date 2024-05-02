import * as GreenWeb from 'greenwebjs';
import { CAT_MOD_HASH, getCATPuzzle, getCATSolution } from './cat';
import { BRIDGING_PUZZLE_HASH, getMessageCoinPuzzle1stCurry, getSecurityCoinSig, spendOutgoingMessageCoin, stringToHex } from './portal';
import { SExp, Tuple, Bytes, getBLSModule } from "clvm";
import { OFFER_MOD, OFFER_MOD_HASH, parseXCHAndCATOffer } from './offer';
import { Network } from '../config';
import { initializeBLS } from "clvm";

export const LOCKER_MOD = "ff02ffff01ff04ffff04ff10ffff04ff8202ffff808080ffff04ffff04ff18ffff04ff8205ffff808080ffff04ffff04ff12ffff04ff8217ffff808080ffff04ffff04ff14ffff04ffff0bffff02ffff03ffff09ff82017fff8080ffff012fffff01ff0bff56ffff0bff1affff0bff1aff66ff1780ffff0bff1affff0bff76ffff0bff1affff0bff1aff66ffff0bffff0101ff178080ffff0bff1affff0bff76ffff0bff1affff0bff1aff66ffff0bffff0101ff82017f8080ffff0bff1affff0bff76ffff0bff1affff0bff1aff66ff2f80ffff0bff1aff66ff46808080ff46808080ff46808080ff4680808080ff0180ffff02ff1effff04ff02ffff04ffff04ff8205ffffff04ffff04ff81bfffff04ff820bffff808080ff808080ff8080808080ff808080ffff04ffff04ff1cffff04ff5fffff04ff8202ffffff04ffff04ff05ffff04ff0bffff04ff8217ffffff04ff820bffff8080808080ff8080808080ff808080808080ffff04ffff01ffffff4946ff3f33ffff3c02ffffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c5ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff1effff04ff02ffff04ff09ff80808080ffff02ff1effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080";
export const UNLOCKER_MOD = "ff02ffff01ff02ff3cffff04ff02ffff04ffff0bffff02ffff03ffff09ffff0dff82017f80ffff012080ffff0182017fffff01ff088080ff0180ffff02ff36ffff04ff02ffff04ff17ffff04ffff0bffff0102ffff0bffff0101ff2f80ff8202ff80ffff04ff5fffff04ffff0bffff0101ff8217ff80ffff04ffff0bffff0101ffff02ff3effff04ff02ffff04ffff04ff8205ffffff04ff820bffff808080ff8080808080ff8080808080808080ff8080ffff04ff822fffffff04ffff02ff12ffff04ff02ffff04ffff02ffff03ffff09ffff12ff81bfffff010180ff8080ffff01ff02ff36ffff04ff02ffff04ff0bffff04ffff0bffff0101ff8217ff80ff8080808080ffff01ff02ff36ffff04ff02ffff04ff05ffff04ffff0bffff0101ff0580ffff04ffff0bffff0101ff81bf80ffff04ffff02ff36ffff04ff02ffff04ff0bffff04ffff0bffff0101ff8217ff80ff8080808080ff8080808080808080ff0180ffff04ffff02ff36ffff04ff02ffff04ff0bffff04ffff0bffff0101ff8217ff80ff8080808080ffff04ff822fffffff04ffff12ffff0101ff820bff80ffff04ff8205ffffff04ffff12ffff0101ff820bff80ffff04ff825fffffff04ffff04ffff04ff28ffff04ff822fffff808080ffff04ffff04ff38ffff04ff8217ffff808080ff808080ff8080808080808080808080ff808080808080ffff04ffff01ffffff3dff4648ffff333cff02ff04ffff04ff10ffff04ffff0bff05ff0b80ff808080ffff04ffff04ff34ffff04ff05ff808080ff178080ffffff02ff2affff04ff02ffff04ffff0bffff02ffff03ffff09ffff0dff82047f80ffff012080ffff0182047fffff01ff088080ff0180ff05ffff02ffff03ffff15ff82067fff8080ffff0182067fffff01ff088080ff018080ffff04ff17ffff04ffff02ffff03ff82037fffff01ff01a04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459affff01ff02ff3effff04ff02ffff04ffff04ffff0101ffff04ffff04ff24ffff04ff5fffff04ff2fffff04ffff04ff5fff8080ff8080808080ffff02ffff03ffff09ff82067fff81bf80ff80ffff01ff04ffff04ff24ffff04ff0bffff04ffff11ff82067fff81bf80ff80808080ff808080ff01808080ff8080808080ff0180ffff04ffff02ffff03ff82037fffff01ff02ff12ffff04ff02ffff04ff05ffff04ff0bffff04ff17ffff04ff2fffff04ff5fffff04ffff11ff81bfff82067f80ffff04ff82037fffff04ff8202ffff8080808080808080808080ffff018202ff80ff0180ff80808080808080ffff04ffff04ff10ffff04ffff0bff05ffff0bff0bff178080ff808080ffff04ffff04ff34ffff04ffff0bff05ff1780ff808080ff2f8080ff02ffff03ff05ffff01ff0bff81e6ffff02ff2effff04ff02ffff04ff09ffff04ffff02ff3affff04ff02ffff04ff0dff80808080ff808080808080ffff0181c680ff0180ffffffffa04bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459aa09dcf97a184f32623d11a73124ceb99a5709b083721e878a16d78f596718ba7b2ffa102a12871fee210fb8619291eaea194581cbd2531e4b23759d225f6806923f63222a102a8d5dd63fba471ebcb1f3e8f7c1e1879b7152a6e7298a91ce119a63400ade7c5ff0bff81a6ffff02ff2effff04ff02ffff04ff05ffff04ffff02ff3affff04ff02ffff04ff07ff80808080ff808080808080ffff0bff2cffff0bff2cff81c6ff0580ffff0bff2cff0bff81868080ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff3effff04ff02ffff04ff09ff80808080ffff02ff3effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080";
export const P2_CONTROLLER_PUZZLE_HASH_MOD = "ff02ffff01ff02ff16ffff04ff02ffff04ffff0bffff02ffff03ffff09ffff0dff1780ffff012080ffff0117ffff01ff088080ff0180ff05ff2f80ffff04ff0bffff04ffff02ff1effff04ff02ffff04ff5fff80808080ffff04ffff02ff5fff81bf80ff80808080808080ffff04ffff01ffff3d46ff3cffff04ffff04ff0cffff04ff0bff808080ffff04ffff04ff0affff04ffff0bff05ff1780ff808080ffff04ffff04ff08ffff04ffff0bff05ffff0bff0bff178080ff808080ff2f808080ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff1effff04ff02ffff04ff09ff80808080ffff02ff1effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080";

/*
>>> from drivers.wrapped_cats import P2_CONTROLLER_PUZZLE_HASH_MOD_HASH
>>> P2_CONTROLLER_PUZZLE_HASH_MOD_HASH.hex()
'a8082b5622ccb27e89f196f024f9851dee0bcb0f2d8afd395caa6d4432f6f85f'
*/
export const P2_CONTROLLER_PUZZLE_HASH_MOD_HASH = "a8082b5622ccb27e89f196f024f9851dee0bcb0f2d8afd395caa6d4432f6f85f";

/*
def get_p2_controller_puzzle_hash_inner_puzzle_hash(
    controller_puzzle_hash: bytes32
) -> Program:
  return P2_CONTROLLER_PUZZLE_HASH_MOD.curry(
    controller_puzzle_hash
  )
*/
export function getP2ControllerPuzzleHashInnerPuzzle(
  controllerPuzzleHash: string
): GreenWeb.clvm.SExp {
  return GreenWeb.util.sexp.curry(
    GreenWeb.util.sexp.fromHex(P2_CONTROLLER_PUZZLE_HASH_MOD),
    [
      GreenWeb.util.sexp.bytesToAtom(controllerPuzzleHash)
    ]
  );
}

/*
def get_unlocker_puzzle(
    message_source_chain: bytes,
    message_source: bytes,
    portal_receiver_launcher_id: bytes32,
    asset_id: bytes32
) -> Program:
  return UNLOCKER_MOD.curry(
    CAT_MOD_HASH,
    P2_CONTROLLER_PUZZLE_HASH_MOD_HASH,
    get_message_coin_puzzle_1st_curry(portal_receiver_launcher_id).get_tree_hash(),
    message_source_chain,
    raw_hash([b"\x01", message_source]),
    asset_id
  )
*/
export function getUnlockerPuzzle(
  messageSourceChain: string,
  messageSource: string,
  portalReceiverLauncherId: string,
  assetId: string | null
): GreenWeb.clvm.SExp {
  return GreenWeb.util.sexp.curry(
    GreenWeb.util.sexp.fromHex(UNLOCKER_MOD),
    [
      GreenWeb.util.sexp.bytesToAtom(CAT_MOD_HASH),
      GreenWeb.util.sexp.bytesToAtom(P2_CONTROLLER_PUZZLE_HASH_MOD_HASH),
      GreenWeb.util.sexp.bytesToAtom(
        GreenWeb.util.sexp.sha256tree(
          getMessageCoinPuzzle1stCurry(portalReceiverLauncherId)
        )
      ),
      GreenWeb.util.sexp.bytesToAtom(messageSourceChain),
      GreenWeb.util.sexp.bytesToAtom(
        GreenWeb.util.stdHash("01" + messageSource) // sha256 1 message_source
      ),
      assetId !== null ? GreenWeb.util.sexp.bytesToAtom(assetId) : SExp.to([])
    ]
  );
}

/*
def get_locker_puzzle(
    message_destination_chain: bytes,
    message_destination: bytes,
    portal_receiver_launcher_id: bytes32,
    asset_id: bytes32
) -> Program:
  return LOCKER_MOD.curry(
    message_destination_chain,
    message_destination,
    CAT_MOD_HASH,
    OFFER_MOD_HASH,
    BRIDGING_PUZZLE_HASH,
    get_p2_controller_puzzle_hash_inner_puzzle_hash(
      get_unlocker_puzzle(
        message_destination_chain,
        message_destination,
        portal_receiver_launcher_id,
        asset_id
      ).get_tree_hash()
    ).get_tree_hash(),
    asset_id
  )
*/
export function getLockerPuzzle(
  messageDestinationChain: string,
  messageDestination: string,
  portalReceiverLauncherId: string,
  assetId: string | null
): GreenWeb.clvm.SExp {
  return GreenWeb.util.sexp.curry(
    GreenWeb.util.sexp.fromHex(LOCKER_MOD),
    [
      GreenWeb.util.sexp.bytesToAtom(messageDestinationChain),
      GreenWeb.util.sexp.bytesToAtom(messageDestination),
      GreenWeb.util.sexp.bytesToAtom(CAT_MOD_HASH),
      GreenWeb.util.sexp.bytesToAtom(OFFER_MOD_HASH),
      GreenWeb.util.sexp.bytesToAtom(BRIDGING_PUZZLE_HASH),
      GreenWeb.util.sexp.bytesToAtom(
        GreenWeb.util.sexp.sha256tree(
          getP2ControllerPuzzleHashInnerPuzzle(
            GreenWeb.util.sexp.sha256tree(
              getUnlockerPuzzle(
                messageDestinationChain,
                messageDestination,
                portalReceiverLauncherId,
                assetId
              )
            )
          )
        )
      ),
      assetId !== null ? GreenWeb.util.sexp.bytesToAtom(assetId) : SExp.to([])
    ]
  );
}

/*
def get_p2_controller_puzzle_hash_inner_solution(
    my_id: bytes32,
    controller_parent_info: bytes32,
    controller_amount: int,
    delegated_puzzle: Program,
    delegated_solution: Program
) -> Program:
  return Program.to([
    my_id,
    controller_parent_info,
    controller_amount,
    delegated_puzzle,
    delegated_solution
  ])
*/
export function getP2ControllerPuzzleHashInnerSolution(
  myId: string,
  controllerParentInfo: string,
  controllerAmount: GreenWeb.BigNumber,
  delegatedPuzzle: GreenWeb.clvm.SExp,
  delegatedSolution: GreenWeb.clvm.SExp
): GreenWeb.clvm.SExp {
  return SExp.to([
    GreenWeb.util.sexp.bytesToAtom(myId),
    GreenWeb.util.sexp.bytesToAtom(controllerParentInfo),
    GreenWeb.util.sexp.bytesToAtom(
      GreenWeb.util.coin.amountToBytes(controllerAmount)
    ),
    delegatedPuzzle,
    delegatedSolution
  ]);
}

/*
def get_unlocker_solution(
    message_coin_parent_id: bytes32,
    message_nonce_hash: bytes32,
    receiver: bytes32,
    asset_amount_b32: bytes32,
    my_puzzle_hash: bytes32,
    my_id: bytes32,
    locked_coin_proofs: List[Tuple[bytes32, int]]
) -> Program:
  return Program.to([
    message_coin_parent_id,
    message_nonce_hash,
    receiver,
    asset_amount_b32,
    my_puzzle_hash,
    my_id,
    Program.to(locked_coin_proofs)
  ])
*/
export function getUnlockerSolution(
  messageCoinParentId: string,
  messageNonce: string,
  receiver: string,
  assetAmount_b32: string,
  myPuzzleHash: string,
  myId: string,
  lockedCoinProofs: [string, GreenWeb.BigNumber][]
): GreenWeb.clvm.SExp {
  return SExp.to([
    GreenWeb.util.sexp.bytesToAtom(messageCoinParentId),
    GreenWeb.util.sexp.bytesToAtom(
      GreenWeb.util.stdHash("01" + GreenWeb.util.unhexlify(messageNonce)!) // sha256 1 nonce
    ),
    GreenWeb.util.sexp.bytesToAtom(receiver),
    GreenWeb.util.sexp.bytesToAtom(assetAmount_b32),
    GreenWeb.util.sexp.bytesToAtom(myPuzzleHash),
    GreenWeb.util.sexp.bytesToAtom(myId),
    SExp.to(lockedCoinProofs.map((proof) => new Tuple<SExp, SExp>(
          GreenWeb.util.sexp.bytesToAtom(proof[0]),
          GreenWeb.util.sexp.bytesToAtom(
            GreenWeb.util.coin.amountToBytes(proof[1])
          ),
    ))),
  ]);
}

/*
def get_locker_solution(
    my_amount: int,
    my_id: bytes32,
    asset_amount: int,
    receiver: bytes
) -> Program:
  return Program.to([
    my_amount,
    my_id,
    asset_amount,
    receiver
  ])
*/
export function getLockerSolution(
  myAmount: GreenWeb.BigNumber,
  myId: string,
  assetAmount: GreenWeb.BigNumber,
  receiver: string
): GreenWeb.clvm.SExp {
  return SExp.to([
    GreenWeb.util.sexp.bytesToAtom(
      GreenWeb.util.coin.amountToBytes(myAmount)
    ),
    GreenWeb.util.sexp.bytesToAtom(myId),
    GreenWeb.util.sexp.bytesToAtom(
      GreenWeb.util.coin.amountToBytes(assetAmount)
    ),
    GreenWeb.util.sexp.bytesToAtom(receiver)
  ]);
}

export async function lockCATs(
  offer: string,
  evmNetwork: Network, // destination
  coinsetNetwork: Network, // source
  wrappedCatContractAddress: string,
  ethTokenReceiverAddress: string,
  updateStatus: (status: string) => void
): Promise<[any, string]> {
  wrappedCatContractAddress = GreenWeb.util.unhexlify(wrappedCatContractAddress)!;
  ethTokenReceiverAddress = GreenWeb.util.unhexlify(ethTokenReceiverAddress)!;

  updateStatus("Initializing BLS...");
  await initializeBLS();

  const coinSpends: InstanceType<typeof GreenWeb.CoinSpend>[] = [];
  const sigs: string[] = [];

  updateStatus("Parsing offer...");
  const [
    offerCoinSpends,
    offerAggSig,
    securityCoin,
    securityCoinPuzzle,
    securityCoinSk,
    tailHashHex,
    catSourceCoin,
    catSourceCoinLineageProof
  ] = parseXCHAndCATOffer(offer);

  const bridgeXCH = tailHashHex === null;
  coinSpends.push(...offerCoinSpends);
  sigs.push(offerAggSig);
  updateStatus("Building transaction...");

  /* If locking XCH, we need to modify security coin amount & later rewrite spend to also lock CATs */
  securityCoin.amount = GreenWeb.BigNumber.from(coinsetNetwork.messageToll);

  /* spend locker coin */
  const lockerPuzzle = getLockerPuzzle(
    stringToHex(evmNetwork.id),
    wrappedCatContractAddress,
    coinsetNetwork.portalLauncherId!,
    tailHashHex
  );
  const lockerPuzzleHash = GreenWeb.util.sexp.sha256tree(lockerPuzzle);

  const lockerCoin = new GreenWeb.Coin();
  lockerCoin.parentCoinInfo = GreenWeb.util.coin.getName(securityCoin);
  lockerCoin.puzzleHash = lockerPuzzleHash;
  lockerCoin.amount = coinsetNetwork.messageToll;

  const lockerCoinName = GreenWeb.util.coin.getName(lockerCoin);
  const asset_amount = bridgeXCH ?
    GreenWeb.BigNumber.from(securityCoin.amount).sub(GreenWeb.BigNumber.from(coinsetNetwork.messageToll)) :
    catSourceCoin.amount;
  const lockerCoinSolution = getLockerSolution(
    GreenWeb.BigNumber.from(lockerCoin.amount),
    GreenWeb.util.coin.getName(lockerCoin),
    GreenWeb.BigNumber.from(asset_amount),
    ethTokenReceiverAddress
  );

  const lockerCoinSpend = new GreenWeb.util.serializer.types.CoinSpend();
  lockerCoinSpend.coin = lockerCoin;
  lockerCoinSpend.puzzleReveal = lockerPuzzle;
  lockerCoinSpend.solution = lockerCoinSolution;

  coinSpends.push(lockerCoinSpend);

  /* spend CAT coin, if present */
  const unlockerPuzzle = getUnlockerPuzzle(
    stringToHex(evmNetwork.id),
    wrappedCatContractAddress,
    coinsetNetwork.portalLauncherId!,
    tailHashHex
  );
  const unlockerPuzzleHash = GreenWeb.util.sexp.sha256tree(unlockerPuzzle);

  const p2ControllerPuzzleHashInnerPuzzle = getP2ControllerPuzzleHashInnerPuzzle(
    unlockerPuzzleHash
  );
  const p2ControllerPuzzleHashInnerPuzzleHash = GreenWeb.util.sexp.sha256tree(
    p2ControllerPuzzleHashInnerPuzzle
  );

  const lockNotarizedPayment = [
    GreenWeb.util.sexp.bytesToAtom(
      lockerCoinName
    ),
    [
      GreenWeb.util.sexp.bytesToAtom(p2ControllerPuzzleHashInnerPuzzleHash),
      catSourceCoin.amount
    ]
  ];

  if(tailHashHex !== null) {
    const catSourceCoinInnerSolution = SExp.to([
      lockNotarizedPayment,
    ]);

    const catSourceCoinProof = new GreenWeb.Coin();
    catSourceCoinProof.parentCoinInfo = catSourceCoin.parentCoinInfo;
    catSourceCoinProof.puzzleHash = OFFER_MOD_HASH; // inner puzzle hash
    catSourceCoinProof.amount = catSourceCoin.amount;

    const catSourceCoinSolution = getCATSolution(
      catSourceCoinInnerSolution,
      GreenWeb.util.coin.toProgram(catSourceCoinLineageProof),
      GreenWeb.util.coin.getName(catSourceCoin),
      catSourceCoin,
      catSourceCoinProof,
      GreenWeb.BigNumber.from(catSourceCoin.amount.toString()),
      GreenWeb.BigNumber.from(0)
    );

    const catSourceCoinPuzzle = getCATPuzzle(
      tailHashHex,
      GreenWeb.util.sexp.fromHex(OFFER_MOD)
    );

    const catSourceCoinSpend = new GreenWeb.util.serializer.types.CoinSpend();
    catSourceCoinSpend.coin = catSourceCoin;
    catSourceCoinSpend.puzzleReveal = catSourceCoinPuzzle;
    catSourceCoinSpend.solution = catSourceCoinSolution;

    coinSpends.push(catSourceCoinSpend);
  } else {
    // rewrite XCH source coin spend to also lock XCH
    for(var i = 0; i < coinSpends.length; ++i) {
      const coinSpend = coinSpends[i];
      const spentCoinName = GreenWeb.util.coin.getName(coinSpend.coin);

      if(spentCoinName === securityCoin.parentCoinInfo) {
        coinSpends[i].solution = SExp.to([
          [
            GreenWeb.util.sexp.bytesToAtom(spentCoinName),
            [
              GreenWeb.util.sexp.bytesToAtom(securityCoin.puzzleHash),
              securityCoin.amount
            ]
          ],
          lockNotarizedPayment,
        ]);
        
        break;
      }
    }
  }
  
  /* spend security coin */
  const securityCoinOutputConds = [
    GreenWeb.spend.assertCoinAnnouncementCondition(
      GreenWeb.util.stdHash(
        lockerCoinName + ethTokenReceiverAddress
      ),
    ),
    SExp.to([
        GreenWeb.util.sexp.bytesToAtom("40"), // ASSERT_CONCURRENT_SPEND
        GreenWeb.util.sexp.bytesToAtom(lockerCoinName),
    ]),
    GreenWeb.spend.createCoinCondition(
      lockerCoin.puzzleHash,
      lockerCoin.amount
    ),
  ];
  const securityCoinSolution = GreenWeb.util.sexp.standardCoinSolution(
    securityCoinOutputConds
  );

  const securityCoinSpend = new GreenWeb.util.serializer.types.CoinSpend();
  securityCoinSpend.coin = securityCoin;
  securityCoinSpend.puzzleReveal = securityCoinPuzzle;
  securityCoinSpend.solution = securityCoinSolution;
  
  coinSpends.push(securityCoinSpend);
  sigs.push(getSecurityCoinSig(
    securityCoin,
    securityCoinOutputConds,
    securityCoinSk,
    coinsetNetwork.aggSigData!
  ));

  /* spend message coin */
  const messageCoinSpend = spendOutgoingMessageCoin(coinsetNetwork, lockerCoinName)
  coinSpends.push(messageCoinSpend);

  /* lastly, aggregate sigs and build spend bundle */
  const { AugSchemeMPL, G2Element } = getBLSModule();

  const sb = new GreenWeb.util.serializer.types.SpendBundle();
  sb.coinSpends = coinSpends;
  sb.aggregatedSignature = Buffer.from(
    AugSchemeMPL.aggregate(
      sigs.map((sig) => G2Element.from_bytes(Buffer.from(sig, "hex")))
    ).serialize()
  ).toString("hex");

  const nonce = GreenWeb.util.coin.getName(messageCoinSpend.coin);
  return [sb, nonce];
}
