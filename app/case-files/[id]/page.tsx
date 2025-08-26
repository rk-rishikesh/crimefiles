"use client";
import React, { useMemo, useState } from "react";
import Image from "next/image";
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
    const [activeTab, setActiveTab] = useState<number>(1);
    const [currentSuspectIndex, setCurrentSuspectIndex] = useState<number>(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);
    const [isInterrogationOpen, setIsInterrogationOpen] = useState<boolean>(false);
    const [chatInput, setChatInput] = useState<string>("");
    const [messages, setMessages] = useState<Array<{ sender: "you" | "suspect"; text: string }>>([]);

    const TabNames = ["Case File", "Hints", "Suspects"];

    const selectedSuspect = useMemo(() => {
        if (!caseFile) return undefined;
        return caseFile.suspects.find((s) => s.id === selectedSuspectId);
    }, [caseFile, selectedSuspectId]);

    const handlePrev = () => {
        if (!caseFile) return;
        setCurrentSuspectIndex((prev) => (prev - 1 + caseFile.suspects.length) % caseFile.suspects.length);
    };

    const handleNext = () => {
        if (!caseFile) return;
        setCurrentSuspectIndex((prev) => (prev + 1) % caseFile.suspects.length);
    };

    const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(null);
    };

    const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (touchStartX === null || touchEndX === null) return;
        const distance = touchStartX - touchEndX;
        const minSwipeDistance = 50;
        if (distance > minSwipeDistance) {
            handleNext();
        } else if (distance < -minSwipeDistance) {
            handlePrev();
        }
        setTouchStartX(null);
        setTouchEndX(null);
    };

    const openInterrogation = (suspectId: string) => {
        setSelectedSuspectId(suspectId);
        setIsInterrogationOpen(true);
        setMessages([
            { sender: "suspect", text: "You think I did it? Ask your questions." },
        ]);
        setChatInput("");
    };

    const closeInterrogation = () => {
        setIsInterrogationOpen(false);
    };

    const generateSuspectReply = (): string => {
        if (!selectedSuspect) return "I have nothing to say.";
        switch (selectedSuspect.id) {
            case "s1":
                return "I was preparing the audit, not touching the vault.";
            case "s2":
                return "Tokens were rotated correctly. Check the logs.";
            case "s3":
                return "I'm just an intern. I formatted reports, nothing more.";
            default:
                return "You’ll need more than accusations.";
        }
    };

    const handleSendMessage = () => {
        const trimmed = chatInput.trim();
        if (!trimmed) return;
        const userMsg = { sender: "you" as const, text: trimmed };
        setMessages((prev) => [...prev, userMsg]);
        setChatInput("");
        const reply = generateSuspectReply();
        setTimeout(() => {
            setMessages((prev) => [...prev, { sender: "suspect", text: reply }]);
        }, 300);
    };
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

    return (
        <main className="w-full min-h-screen text-white bg-case-pattern bg-cover bg-center">
            <div className="flex min-h-screen flex-col">
                {/* Left vertical tabs */}
                <div className="text-2xl font-funnel-display text-white p-8">CRIME FILES</div>
                <aside className="w-56 p-4 space-y-2">
                    {[1, 2, 3].map((n) => (
                        <button
                            key={n}
                            onClick={() => setActiveTab(n)}
                            aria-selected={activeTab === n}
                            className={`${activeTab === n ? "font-bold font-funnel-display text-3xl" : "font-funnel-display text-3xl text-zinc-300"} w-full text-left px-4 py-3 transition-colors`}
                        >
                            {`${TabNames[n - 1]}`}
                        </button>
                    ))}
                </aside>

                {/* Right content area */}
                <section className="flex-1 left-1/3 fixed">
                    {activeTab === 1 && (
                        <div className="h-screen">
                            <div className="p-8 fixed bottom-5">
                                <h1 className="text-[#2b2f6a] text-6xl font-funnel-display mb-4">{caseFile.title}</h1>
                                <p className="mt-2 text-[#2b2f6a] font-funnel-display mb-8">{caseFile.excerpt}</p>
                                <div className="mt-6">
                                    <div className="text-[11px] uppercase tracking-widest text-zinc-400 mb-4">Case File</div>
                                    <p className="mt-2 leading-7 text-[#2b2f6a] font-funnel-display w-[750px]">{caseFile.story}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="py-10 text-[#2b2f6a]">
                            <div className="mt-6">
                                <div className="p-8 fixed bottom-5">
                                    <h1 className="text-[#2b2f6a] text-6xl font-funnel-display mb-4">{caseFile.title}</h1>
                                    <p className="mt-2 text-[#2b2f6a] font-funnel-display mb-8">{caseFile.excerpt}</p>
                                    <ul className="mt-3 space-y-2">
                                        <div className="text-[11px] uppercase tracking-widest text-zinc-400 py-4">Hints</div>
                                        {caseFile.hints.map((hint, idx) => (
                                            <li key={idx} className="flex gap-2 text-[#2b2f6a] font-funnel-display">
                                                <Image src="/assets/background/hintIcon.png" alt="hint" width={22} height={20} />
                                                <span>{hint}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <>
                            <div
                                className="fixed right-5">
                                <Image className="rounded-full mt-16" src={caseFile.suspects[currentSuspectIndex]?.image || "/suspect.png"} alt="suspect" width={450} height={450} />
                            </div>
                            <div className="fixed bottom-5">
                                <div className="relative select-none flex flex-col justify-center items-center">
                                    <div
                                        className="overflow-hidden"
                                        onTouchStart={onTouchStart}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={onTouchEnd}
                                    >
                                        <div
                                            className="flex transition-transform duration-300 ease-out"
                                            style={{ transform: `translateX(-${currentSuspectIndex * 100}%)` }}
                                        >
                                            {caseFile.suspects.map((suspect) => (
                                                <div key={suspect.id} className="min-w-full ">
                                                    <div className="min-h-[70vh] md:min-h-[72vh] grid items-stretch px-6 md:px-20 text-[#1e2a42] ">
                                                        <div className="grid md:grid-cols-3 gap-6 w-full ">
                                                            <div className="md:col-span-3 self-center w-full">

                                                                <div className="mt-36">
                                                                    <div className="text-6xl md:text-6xl font-funnel-display text-[#2b2f6a]">
                                                                        {suspect.name}
                                                                    </div>
                                                                </div>
                                                                {suspect.description && (
                                                                    <p className="text-2xl leading-snug font-funnel-display py-4 w-1/2 min-h-[100px]">
                                                                        {suspect.description}
                                                                    </p>
                                                                )}
                                                                <div className="mt-8">
                                                                    <div className="grid grid-cols-4 justify-center items-center">
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Occupation</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Age</div>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-[12px] tracking-[0.3em] uppercase text-[#6a7190]">Gender</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 border-t-2 border-dashed border-[#2b2f6a]" />
                                                                    <div className="mt-4 grid grid-cols-4">
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.occupation}</div>
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.age}</div>
                                                                        <div className="text-2xl font-funnel-display text-[#2b2f6a]">{suspect.gender}</div>
                                                                        <div onClick={() => openInterrogation(suspect.id)} className="cursor-pointer text-2xl font-funnel-display text-[#2b2f6a]"> _Interrogate_</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {caseFile.suspects.length > 1 && (
                                        <>
                                            <button
                                                aria-label="Previous suspect"
                                                onClick={handlePrev}
                                                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center text-[#2b2f6a]"
                                            >
                                                ‹
                                            </button>
                                            <button
                                                aria-label="Next suspect"
                                                onClick={handleNext}
                                                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 h-10 w-10 grid place-items-center text-[#2b2f6a]"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}

                                    {caseFile.suspects.length > 1 && (
                                        <div className="mt-3 flex justify-center gap-2">
                                            {caseFile.suspects.map((_, i) => (
                                                <span key={i} className={`h-1.5 w-6 ${i === currentSuspectIndex ? "bg-[#2b2f6a]" : "bg-zinc-400"}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* <div className="px-6 md:px-20 fixed bottom-5 right-5">
                                <button
                                    onClick={() => handleEncrypt()}
                                    disabled={!selectedSuspect || submitted}
                                    className={`mt-6 w-full md:w-auto h-11 px-6 border border-[#2b2f6a] text-[#2b2f6a] hover:bg-[#2b2f6a]/10 transition-colors ${!selectedSuspectId || submitted ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    Submit verdict
                                </button>
                            </div> */}

                                {/* {submitted && selectedSuspect && (
                                <div className="mt-4 mx-6 md:mx-20 p-4 border border-[#2b2f6a] bg-white/40 text-[#1e2a42]">
                                    You selected <span className="font-semibold text-[#2b2f6a]">{selectedSuspect.name}</span> as guilty, your verdict is encrypted via Blocklock.
                                    <div className="text-sm text-[#2b2f6a] mt-1">The verdict will be revealed in 7 days.</div>
                                </div>
                            )} */}
                            </div>
                        </>

                    )}
                </section>
                {isInterrogationOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white text-[#1e2a42] border border-[#2b2f6a] shadow-xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2b2f6a]/30">
                                <div className="font-funnel-display text-xl text-[#2b2f6a]">
                                    {selectedSuspect?.name ? `Interrogating ${selectedSuspect.name}` : "Interrogation"}
                                </div>
                                <button
                                    onClick={closeInterrogation}
                                    aria-label="Close interrogation"
                                    className="text-[#2b2f6a] hover:opacity-80"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="h-80 md:h-96 overflow-y-auto px-4 py-3 space-y-3 bg-white">
                                {messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.sender === "you" ? "justify-end" : "justify-start"}`}>
                                        <div className={`${m.sender === "you" ? "bg-[#2b2f6a] text-white" : "bg-zinc-100 text-[#1e2a42]"} px-3 py-2 rounded-md max-w-[80%]`}>
                                            <div className="text-xs opacity-70 mb-0.5">{m.sender === "you" ? "You" : selectedSuspect?.name || "Suspect"}</div>
                                            <div className="font-funnel-display">{m.text}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#2b2f6a]/30 bg-white">
                                <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                                    placeholder="Ask a question..."
                                    className="flex-1 border border-[#2b2f6a]/40 px-3 py-2 outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!chatInput.trim()}
                                    className={`h-10 px-4 border border-[#2b2f6a] text-[#2b2f6a] ${!chatInput.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2b2f6a]/10"}`}
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
