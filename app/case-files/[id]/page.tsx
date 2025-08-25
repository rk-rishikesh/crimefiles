"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { getCaseById } from "../cases";
import Wallet from "@/app/wallet";
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';
import { ethers, getBytes } from "ethers";
import { Blocklock, encodeCiphertextToSolidity, encodeCondition } from "blocklock-js";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params as Promise<{ id: string }>);
    const caseFile = useMemo(() => getCaseById(id), [id]);
    const [selectedSuspectId, setSelectedSuspectId] = useState<string>("");
    const { isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [submitted, setSubmitted] = useState<boolean>(false);
    const handleEncrypt = async () => {
        if (submitted) {
            return;
        }

        if (!walletClient) {
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(walletClient.transport);
            const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);
            const signer = await provider.getSigner();
            console.log(signer);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Calculate target block height based on decryption time
            const currentBlock = await provider.getBlockNumber();
            // Decrypt in 7 Days
            const blockHeight = BigInt("33168357");

            // Set the message to encrypt
            const msgBytes = ethers.AbiCoder.defaultAbiCoder().encode(["string"], [selectedSuspectId]);
            const encodedMessage = getBytes(msgBytes);
            console.log("Encoded message:", encodedMessage);

            // Encrypt the encoded message usng Blocklock.js library
            const blocklockjs = Blocklock.createBaseSepolia(jsonProvider);
            const cipherMessage = blocklockjs.encrypt(encodedMessage, blockHeight);
            console.log("Ciphertext:", cipherMessage);
            // Set the callback gas limit and price
            // Best practice is to estimate the callback gas limit e.g., by extracting gas reports from Solidity tests
            const callbackGasLimit = 700_000;
            // Based on the callbackGasLimit, we can estimate the request price by calling BlocklockSender
            // Note: Add a buffer to the estimated request price to cover for fluctuating gas prices between blocks
            console.log(BigInt(callbackGasLimit));
            const [requestCallBackPrice] = await blocklockjs.calculateRequestPriceNative(BigInt(callbackGasLimit))
            console.log("Request CallBack price:", ethers.formatEther(requestCallBackPrice), "ETH");
            const conditionBytes = encodeCondition(blockHeight);

            const tx = await contract.createTimelockRequestWithDirectFunding(
                callbackGasLimit,
                currentBlock,
                blockHeight,
                conditionBytes,
                encodeCiphertextToSolidity(cipherMessage),
                { value: requestCallBackPrice }
            );

            const receipt = await tx.wait(1);
            if (receipt) {
                setSubmitted(true);
            }
            if (!receipt) throw new Error("Transaction has not been mined");

        } catch (error) {
            console.error('Contract write failed:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
        }
    };

    if (!isConnected) {
        return (
            <Wallet />
        );
    }

    console.log(id);

    if (!caseFile) {
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-b from-[#0b0c10] via-[#121418] to-[#0b0c10] text-zinc-100">
                <div className="max-w-xl w-full px-6 py-10 bg-[#121417] border border-zinc-700/60">
                    <h1 className="text-2xl font-funnel-display">Case not found</h1>
                    <p className="text-zinc-400 mt-2">The case you&apos;re looking for doesn&apos;t exist.</p>
                    <div className="mt-6">
                        <Link href="/case-files" className="inline-block border border-amber-400/60 text-amber-300 px-4 py-2">
                            ← Back to all cases
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const selectedSuspect = caseFile.suspects.find((s) => s.id === selectedSuspectId);
    return (
        <main className="w-full min-h-screen bg-black">
            {/* Top hero video area */}
            <section className="relative h-[72vh] overflow-hidden">
                <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={`/case-videos/${id}.mp4`}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            </section>

            {/* Rounded black section overlapping the video */}
            <section className="relative z-20 -mt-20 md:-mt-28 rounded-t-[120px] bg-black text-white pt-10">
                <div className="px-6 py-10 h-screen">

                    <div id="case-content" className="mt-6 grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-black p-6">
                            <h1 className="text-3xl md:text-4xl font-funnel-display">{caseFile.title}</h1>
                            <p className="mt-2 text-zinc-300 font-funnel-display">{caseFile.excerpt}</p>

                            <div className="mt-6">
                                <div className="text-[11px] uppercase tracking-widest text-zinc-400">Case File</div>
                                <p className="mt-2 leading-7 text-zinc-200 font-funnel-display">{caseFile.story}</p>
                            </div>

                            <div className="mt-6">
                                <div className="text-[11px] uppercase tracking-widest text-zinc-400">Hints</div>
                                <ul className="mt-3 space-y-2">
                                    {caseFile.hints.map((hint, idx) => (
                                        <li key={idx} className="flex gap-2 text-zinc-200 font-funnel-display">
                                            <span className="text-amber-300">▣</span>
                                            <span>{hint}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-[#121417] border border-zinc-700/60 p-6">
                            <div className="text-[11px] uppercase tracking-widest text-zinc-400">Suspects</div>
                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {caseFile.suspects.map((suspect) => (
                                    <label
                                        key={suspect.id}
                                        className={`border p-4 cursor-pointer transition-colors ${selectedSuspectId === suspect.id ? "border-amber-400/60 bg-amber-400/5" : "border-zinc-700/60 hover:border-zinc-500"}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="radio"
                                                name="suspect"
                                                className="mt-1"
                                                checked={selectedSuspectId === suspect.id}
                                                onChange={() => setSelectedSuspectId(suspect.id)}
                                                disabled={submitted}
                                            />
                                            <div>
                                                <div className="text-zinc-100">{suspect.name}</div>
                                                {suspect.description && (
                                                    <div className="text-sm text-zinc-400 mt-1">{suspect.description}</div>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button
                                onClick={() => handleEncrypt()}
                                disabled={!selectedSuspect || submitted}
                                className={`mt-4 w-full h-11 px-6 border text-amber-300 border-amber-400/60 hover:bg-amber-400/10 transition-colors ${!selectedSuspectId || submitted ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Submit verdict
                            </button>

                            {submitted && selectedSuspect && (
                                <div className="mt-4 p-4 border border-amber-400/60 bg-amber-400/5 text-zinc-100">
                                    You selected <span className="font-semibold text-amber-300">{selectedSuspect.name}</span> as guilty, your verdict is encrypted via Blocklock.
                                    <div className="text-sm text-zinc-400 mt-1">The verdict will be revealed in 7 days.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
