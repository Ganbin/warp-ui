"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Network, NetworkType, Token, TOKENS } from "../config"
import { ethers } from "ethers"
import { useAccount, useReadContract, useTransactionConfirmations, useWriteContract } from "wagmi"
import * as GreenWeb from 'greenwebjs'
import { useEffect, useState } from "react"
import { getStepTwoURL } from "./urls"
import { erc20ABI, ERC20BridgeABI, WrappedCATABI } from "../drivers/abis"
import { burnCATs } from "../drivers/erc20bridge"
import { lockCATs } from "../drivers/catbridge"
import { pushTx, sbToJSON } from "../drivers/rpc"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { useWallet } from "../ChiaWalletManager/WalletContext"

export default function StepOne({
  sourceChain,
  destinationChain,
}: {
  sourceChain: Network,
  destinationChain: Network,
}) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const recipient = searchParams.get('recipient')!
  const amount = searchParams.get('amount') ?? ""

  const token: Token = TOKENS.find((token) => token.symbol === searchParams.get("token"))!

  var decimals = 3
  if (token.symbol === "ETH" && sourceChain.type == NetworkType.EVM) {
    decimals = 6
  }
  if (token.symbol === "XCH") {
    decimals = 12
  }

  var amountMojo: bigint
  try {
    amountMojo = ethers.parseUnits(amount, decimals)
  } catch (_) {
    toast.error("Invalid amount", { description: "3 decimal places allowed for any token, except for ETH (6 decimal places) and XCH (12 decimal places)", duration: 20000, id: "invalid-amount" })
    router.push("/bridge")
    return <></>
  }

  const amountMojoAfterFee = amountMojo - amountMojo * BigInt(30) / BigInt(10000)

  const withToolTip = (triggerText: any, toolTopContent: string) => {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger className="rounded-full transition-colors focus-visible:outline-none ring-offset-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{triggerText}</TooltipTrigger>
          <TooltipContent>
            <p>{toolTopContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const chainIcons = (() => {
    let sourceChainIcon = <></>
    let destinationChainIcon = <></>

    switch (sourceChain.displayName) {
      case "Base":
        sourceChainIcon = <BaseIcon />
        break
      case "Chia":
        sourceChainIcon = <Image className="w-6 h-auto" src={"/icons/chia-icon.svg"} alt="Chia icon" width={30} height={30} priority />
        break
      case "Ethereum":
        sourceChainIcon = <ETHIcon />
        break
      default:
        break
    }
    switch (destinationChain.displayName) {
      case "Base":
        destinationChainIcon = <BaseIcon />
        break
      case "Chia":
        destinationChainIcon = <Image className="w-6 h-auto" src={"/icons/chia-icon.svg"} alt="Chia icon" width={30} height={30} priority />
        break
      case "Ethereum":
        destinationChainIcon = <ETHIcon />
        break
      default:
        break
    }
    return {
      sourceChainIcon: withToolTip(sourceChainIcon, `${sourceChain.displayName} Chain`),
      destinationChainIcon: withToolTip(destinationChainIcon, `${destinationChain.displayName} Chain`)
    }
  })()

  return (
    <>
      <p className="px-4">Confirm the details below and ensure you have sufficient assets for one transaction on both networks.</p>

      <div className="p-6 mt-6 bg-background flex flex-col gap-2 font-light rounded-md relative animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="mb-2 font-extralight opacity-80">Sending</p>
        <ArrowRight />
        <div className="flex gap-4">
          {chainIcons.sourceChainIcon}
          {/* Pls check whether warped text shows in correct places here */}
          <p className="text-xl flex items-center gap-2">{amount} {sourceChain.type !== token.sourceNetworkType && "Warped"} {token.symbol === "ETH" && sourceChain.type == NetworkType.COINSET ? <>milliETH {withToolTip(<div className="group-hover:opacity-80 h-5 flex justify-center items-center shadow-sm shadow-white/50 border rounded-full aspect-square bg-accent text-sm font-normal text-primary/80 w-auto">?</div>, 'milliEther automatically converts to ETH at a 1000:1 ratio.')}</> : token.symbol}</p>
        </div>

        <div className="flex gap-4">
          {chainIcons.sourceChainIcon}
          <p className="text-xl">{ethers.formatUnits(sourceChain.messageToll, sourceChain.type == NetworkType.EVM ? 18 : 12)}
            {sourceChain.type == NetworkType.EVM ? ' ETH ' : ' XCH '}
            <span className="bg-theme-purple rounded-full px-3 ml-2">Toll</span>
          </p>
        </div>
      </div>

      <div className="p-6 mt-2 bg-background flex flex-col gap-2 font-light rounded-md relative animate-in fade-in slide-in-from-bottom-2 duration-500">
        <p className="mb-2 font-extralight opacity-80">Receiving (after 0.3% protocol tip)</p>
        <ArrowLeft />

        <div className="flex gap-4">
          {chainIcons.destinationChainIcon}
          {sourceChain.type == NetworkType.COINSET && token.symbol == "ETH" ? (
            <p className="text-xl">{ethers.formatUnits(amountMojoAfterFee, 6)} ETH</p>
          ) : (
            token.symbol == "XCH" ? (
              <p className="text-xl">{ethers.formatUnits(amountMojoAfterFee, 12)} XCH</p>
            ) : (
              <p className="text-xl flex items-center gap-2">{ethers.formatUnits(amountMojoAfterFee, 3)} {token.symbol === "ETH" ? <>Warped milliETH {withToolTip(<div className="group-hover:opacity-80 h-5 flex justify-center items-center shadow-sm shadow-white/50 border rounded-full aspect-square bg-accent text-sm font-normal text-primary/80 w-auto">?</div>, 'Ether automatically converts to milliETH at a 1:1000 ratio.')}</> : token.symbol}</p> // Pls check whether warped text shows in correct places here
            )
          )
          }
        </div>
      </div>


      <div className="p-6 mt-2 bg-background flex flex-col gap-2 font-light rounded-md relative animate-[delayed-fade-in_0.7s_ease_forwards]">
        <p className="mb-2 font-extralight opacity-80">Recipient address:</p>
        <p className="text-xl mb-4">{recipient}</p>
        <div className="flex">
          {sourceChain.type == NetworkType.COINSET ? (
            <ChiaButton
              token={token}
              sourceChain={sourceChain}
              destinationChain={destinationChain}
              recipient={recipient}
              amount={amount}
              amountMojo={amountMojo}
            />
          ) : (
            <EthereumButton
              token={token}
              sourceChain={sourceChain}
              destinationChain={destinationChain}
              recipient={recipient}
              amount={amount}
              amountMojo={amountMojo}
            />
          )}
        </div>
      </div>

    </>
  )
}

function EthereumButton({
  token,
  sourceChain,
  destinationChain,
  recipient,
  amount,
  amountMojo
}: {
  token: Token,
  sourceChain: Network,
  destinationChain: Network,
  recipient: string,
  amount: string,
  amountMojo: bigint
}) {
  const tokenInfo = token.supported.find((supported) => supported.evmNetworkId === sourceChain.id)!

  const router = useRouter()
  const account = useAccount()
  const [waitingForTx, setWaitingForTx] = useState(false)

  // allowance stuff
  const { data: tokenDecimalsFromContract } = useReadContract({
    address: tokenInfo.contractAddress,
    abi: erc20ABI,
    functionName: "decimals",
    args: [],
  })
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenInfo.contractAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [
      account.address!, sourceChain.erc20BridgeAddress!
    ],
  })
  const approvedEnough = token.symbol === 'ETH' || token.sourceNetworkType == NetworkType.COINSET || (
    allowance && tokenDecimalsFromContract && allowance >= ethers.parseUnits(amount, tokenDecimalsFromContract)
  )

  const { data: approvalTxHash, writeContract: writeContractForApproval } = useWriteContract()

  const { data: approvalTxConfirmations } = useTransactionConfirmations({
    hash: approvalTxHash,
    query: {
      enabled: approvalTxHash !== undefined && !approvedEnough,
      refetchInterval: 1000,
    }
  })

  useEffect(() => {
    if (approvalTxConfirmations ?? 0 > 0) {
      refetchAllowance()
    }
  }, [approvalTxConfirmations, refetchAllowance])
  // end allowance stuff

  const { data: hash, writeContract } = useWriteContract()

  useEffect(() => {
    if (hash !== undefined) {
      router.push(getStepTwoURL({
        sourceNetworkId: sourceChain.id,
        destinationNetworkId: destinationChain.id,
        txHash: hash
      }))
    }
  })

  if (waitingForTx) {
    return (
      <LoadingButton text="Waiting For Transaction Approval" />
    )
  }

  const initiateBridgingFromEVMToChia = async () => {
    const receiver = GreenWeb.util.address.addressToPuzzleHash(recipient)

    setWaitingForTx(true)

    if (token.symbol == "ETH") {
      writeContract({
        address: sourceChain.erc20BridgeAddress as `0x${string}`,
        abi: ERC20BridgeABI,
        functionName: "bridgeEtherToChia",
        args: [
          ("0x" + receiver) as `0x${string}`,
        ],
        value: ethers.parseEther(amount) + sourceChain.messageToll,
        chainId: sourceChain.chainId
      })
    } else if (token.sourceNetworkType == NetworkType.EVM) {
      writeContract({
        address: sourceChain.erc20BridgeAddress as `0x${string}`,
        abi: ERC20BridgeABI,
        functionName: "bridgeToChia",
        args: [
          token.supported.find((supported) => supported.evmNetworkId === sourceChain.id)!.contractAddress,
          ("0x" + receiver) as `0x${string}`,
          amountMojo
        ],
        chainId: sourceChain.chainId,
        value: sourceChain.messageToll
      })
    } else {
      // token.sourceNetworkType == NetworkType.COINSET
      writeContract({
        address: tokenInfo.contractAddress,
        abi: WrappedCATABI,
        functionName: "bridgeBack",
        args: [
          ("0x" + receiver) as `0x${string}`,
          amountMojo
        ],
        chainId: sourceChain.chainId,
        value: sourceChain.messageToll
      })
    }
  }

  const approveTokenSpend = async () => {
    writeContractForApproval({
      address: tokenInfo.contractAddress,
      abi: erc20ABI,
      functionName: "approve",
      args: [
        sourceChain.erc20BridgeAddress as `0x${string}`,
        ethers.parseEther(amount)
      ]
    })
  }

  if (!approvedEnough) {
    if (approvalTxHash) {
      return (
        <LoadingButton text="Waiting for transaction confirmation" />
      )
    }

    return (
      <ActionButton
        onClick={approveTokenSpend}
        text="Approve token spend"
      />
    )
  }

  return (
    <ActionButton
      onClick={initiateBridgingFromEVMToChia}
      text="Initiate Bridging"
    />
  )
}

function ChiaButton({
  token,
  sourceChain,
  destinationChain,
  recipient,
  amountMojo
}: {
  token: Token,
  sourceChain: Network,
  destinationChain: Network,
  recipient: string,
  amount: string,
  amountMojo: bigint
}) {
  const router = useRouter()
  const [status, setStatus] = useState("")
  const { walletConnected, createOffer } = useWallet()

  const initiateBridgingFromChiaToEVM = async () => {
    const tokenInfo = token.supported.find((supported) => supported.coinsetNetworkId === sourceChain.id && supported.evmNetworkId === destinationChain.id)!

    var offerMojoAmount = BigInt(sourceChain.messageToll)
    if (token.sourceNetworkType == NetworkType.EVM) {
      // We'll melt CAT mojos and use them as a fee as well
      offerMojoAmount -= amountMojo
    }
    var offer = null

    // either requesting XCH (toll) + asset or just XCH (toll + asset)
    var xchAmount = parseInt(offerMojoAmount.toString())
    var offerAssets = []
    if (tokenInfo.assetId === "00".repeat(32)) {
      xchAmount += parseInt(amountMojo.toString())
    } else {
      offerAssets.push({
        assetId: tokenInfo.assetId,
        amount: parseInt(amountMojo.toString())
      })
    }
    offerAssets.push({
      assetId: "",
      amount: xchAmount
    })

    try {
      const params = {
        offerAssets: offerAssets,
        requestAssets: []
      }
      offer = await createOffer(params)
    } catch (e) {
      console.error(e)
    }

    if (!offer) {
      setStatus("")
      return
    }

    const [sb, nonce] = await (token.sourceNetworkType == NetworkType.EVM ? burnCATs(
      offer,
      sourceChain,
      destinationChain,
      tokenInfo.contractAddress,
      recipient,
      setStatus
    ) : lockCATs(
      offer,
      destinationChain,
      sourceChain,
      tokenInfo.assetId == "00".repeat(32) ? null : tokenInfo.assetId,
      tokenInfo.contractAddress,
      recipient,
      setStatus
    ))

    const pushTxResp = await pushTx(sourceChain.rpcUrl, sb)
    if (!pushTxResp.success) {
      const sbJson = sbToJSON(sb)
      await navigator.clipboard.writeText(JSON.stringify(sbJson, null, 2))
      console.error(pushTxResp)
      toast.error("Failed to push transaction", { description: "Please check console for more details.", duration: 20000, id: "Failed to push transaction" })
      setStatus("")
      return
    } else {
      router.push(getStepTwoURL({
        sourceNetworkId: sourceChain.id,
        destinationNetworkId: destinationChain.id,
        txHash: nonce,
      }))
    }
  }

  if (status.length > 0) {
    return (
      <LoadingButton text={status} />
    )
  }

  return (
    <ActionButton
      text="Initiate Bridging"
      onClick={initiateBridgingFromChiaToEVM}
    />
  )
}

function ActionButton({
  text,
  onClick
}: {
  text: string,
  onClick: () => Promise<void>
}) {
  return (
    <Button className="w-full h-14 bg-theme-purple hover:bg-theme-purple text-primary hover:opacity-80 text-xl" onClick={onClick}>{text}</Button>
  )
}

function LoadingButton({
  text
}: {
  text: string
}) {
  return (
    <Button
      className="relative flex items-center gap-2 w-full h-14 bg-theme-purple hover:bg-theme-purple text-primary hover:opacity-80 text-xl"
      disabled={true}
    >
      <p className="animate-pulse whitespace-normal">{text}</p>
    </Button>
  )
}

function ArrowLeft() {
  return (
    <svg className="opacity-80 w-6 h-auto absolute top-6.5 right-6" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.85355 3.14645C7.04882 3.34171 7.04882 3.65829 6.85355 3.85355L3.70711 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H3.70711L6.85355 11.1464C7.04882 11.3417 7.04882 11.6583 6.85355 11.8536C6.65829 12.0488 6.34171 12.0488 6.14645 11.8536L2.14645 7.85355C1.95118 7.65829 1.95118 7.34171 2.14645 7.14645L6.14645 3.14645C6.34171 2.95118 6.65829 2.95118 6.85355 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
  )
}

function ArrowRight() {
  return (
    <svg className="opacity-80 w-6 h-auto absolute top-6.5 right-6" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
  )
}

function BaseIcon() {
  return (
    <svg className="w-6 h-auto" width="111" height="111" viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="white" />
    </svg>
  )
}

function ETHIcon() {
  return (
    <svg className="w-6 h-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px"><path fill="#9fa8da" d="M11 24L25 2 39 24 25 32z" /><path fill="#7986cb" d="M25 2L39 24 25 32z" /><path fill="#9fa8da" d="M11 27L25 35 39 27 25 46z" /><path fill="#7986cb" d="M25 35L39 27 25 46zM11 24L25 18 39 24 25 32z" /><path fill="#5c6bc0" d="M25 18L39 24 25 32z" /></svg>
  )
}