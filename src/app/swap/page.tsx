"use client";
import React, { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { IoWallet, IoChevronDown } from "react-icons/io5";
import { BsArrowDown } from "react-icons/bs";
import "@solana/wallet-adapter-react-ui/styles.css";
import { IoIosArrowDown } from "react-icons/io";
import { useFetchUSD } from "@/helpers/fetchusd";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import {
  VersionedTransaction,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import toast from "react-hot-toast";
interface Token {
  symbol: string;
  logo: string;
  address: string;
  decimals: string;
}
export default function Page() {
  let monInt: NodeJS.Timeout | null = null;
  const MONITOR_INTERVAL = 10000;
  const rpcUrls = [
    "https://mainnet.helius-rpc.com/?api-key=36630f30-eb16-4b14-90bd-1de494fdddbd",
    "https://solana-mainnet.g.alchemy.com/v2/VmNxXlLtr1Q4R0QiuoagXO6FD8Fvi9rz",
    "https://solemn-proportionate-sailboat.SOLANA_MAINNET.quiknode.pro/3618d14c4338e3d38b39e240684327a449612425/",
  ];

  let currentRpcIndex = 0;
  async function getConnection() {
    const maxAttempts = rpcUrls.length;
    for (let i = 0; i < maxAttempts; i++) {
      const url = rpcUrls[currentRpcIndex];
      const connection = new Connection(url);
      try {
        await connection.getEpochInfo();
        return connection;
      } catch (error: any) {
        console.error(`Connection failed for ${url}:`, error.message);
        currentRpcIndex = (currentRpcIndex + 1) % rpcUrls.length;
      }
    }
    throw new Error("All RPC nodes are currently unavailable");
  }
  const initialSlippageBps = 50;



  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [secondSelectedToken, setSecondSelectedToken] = useState<Token>(
    tokens[1]
  );
  const [amount, setAmount] = useState<number>();
  const { secondTokenPrice: firstTokenPrice } = useFetchUSD(selectedToken);
  const [secondAmount, setSecondAmount] = useState<number>(0);
  const [query, setQuery] = useState("");
  const { publicKey, connected, wallet, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isSecondOpen, setIsSecondOpen] = useState(false);
  const { secondTokenPrice, fetchingUSD } = useFetchUSD(secondSelectedToken);
  const filteredTokens = tokens.filter((token) =>
    token.symbol.toLowerCase().includes(query.toLowerCase())
  );
  const handleWalletConnect = () => {
    const button = document.querySelector(
      ".wallet-adapter-button"
    ) as HTMLButtonElement;
    console.log("button")
    button.click();
  };


  function handleRetryLogic(error: any, retryCount: any, baseDelay: any) {
    let delay = baseDelay * Math.pow(2, retryCount);
    let shouldRetry = true;

    if (error.status === 429) {
      const retryAfter = error.headers?.get("Retry-After");
      if (retryAfter) {
        delay = Math.max(delay, parseInt(retryAfter) * 1000);
      }
      return { shouldRetry: true, delay };
    }
    const nonRetryableConditions = [
      error.message.includes("Invalid input parameters"),
      error.message.includes("Invalid swap response"),
      error.status >= 400 && error.status < 500, // Client errors
    ];
    if (nonRetryableConditions.some((condition) => condition)) {
      return { shouldRetry: false, delay: 0 };
    }
    if (error.name === "AbortError" || error.message.includes("network")) {
      return { shouldRetry: true, delay };
    }

    return { shouldRetry, delay };
  }

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("/api/tokens");
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response}`);
        }

        const data: Token[] = await response.json();
        setTokens(data);
        if (data.length > 0) {
          setSelectedToken(data[0]);
          setSecondSelectedToken(data[1]);
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchTokens();
  }, []);

  //get Quote
  useEffect(() => {
    let interval;
    const getQuote = async () => {
      if (
        !isNaN(Number(amount)) &&
        selectedToken?.address &&
        secondSelectedToken?.address
      ) {
        try {
          setIsLoadingQuote(true);
          const response = await fetch(
            `https://api.jup.ag/swap/v1/quote?inputMint=${
              selectedToken.address
            }&outputMint=${secondSelectedToken.address}&amount=${
              Number(amount) * Math.pow(10, Number(selectedToken.decimals))
            }&slippageBps=50&restrictIntermediateTokens=true`
          );
          if (!response.ok) {
            setIsLoadingQuote(false);
            const data = await response.json();
            throw new Error(`Failed to get Quotes: ${data}`);
          }

          const data = await response.json();
          const formattedOutAmount =
            Number(data.outAmount) /
            Math.pow(10, Number(secondSelectedToken.decimals));
          setSecondAmount(formattedOutAmount);
        } catch (error) {
          console.error("Error fetching tokens:", error);
        } finally {
          setIsLoadingQuote(false);
        }
      }
    };
    getQuote();
    interval = setInterval(() => {
      getQuote();
    }, 3000);
    return () => clearInterval(interval);
  }, [amount, selectedToken, secondSelectedToken]);

  const handleTokensSwap = () => {
    const tempToken = selectedToken;
    secondSelectedToken && setSelectedToken(secondSelectedToken);
    setSecondSelectedToken(tempToken);
  };

  async function getQuote(
    inputMint: string,
    outputMint: string,
    amount: number
  ) {
    try {
      const response = await fetch(
        `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${initialSlippageBps}&restrictIntermediateTokens=true&onlyDirectRoutes=true`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch quote: ${response.statusText}`);
      }
      const quoteResponse = await response.json();
      return quoteResponse;
    } catch (error) {
      // logError(error);
      throw error;
    }
  }
  const handleSwap = async () => {
    if (!publicKey || !wallet || !signTransaction) {
      console.error("Wallet is not connected or does not support signing.");
      return;
    }

    try {
      setIsSwapping(true);

      const connection = await getConnection(); // Ensure working RPC

      const MAX_RETRIES = 5;
      const INITIAL_DELAY = 2000;
      const TIMEOUT_DURATION = 15000;
      let retryCount = 0;
      let lastError = null;
      const initialSlippageBps = 50;

      while (retryCount < MAX_RETRIES) {
        let abortController = new AbortController();
        let timeoutId = setTimeout(
          () => abortController.abort(),
          TIMEOUT_DURATION
        );

        try {
          if (monInt) {
            clearInterval(monInt);
            monInt = null;
            console.log("Monitoring paused during swap.");
          }

          // Fetch swap quote
          const currentSlippage = initialSlippageBps + retryCount * 25;
          const quoteData = await getQuote(
            selectedToken.address,
            secondSelectedToken.address,
            (amount ?? 0) * Math.pow(10, Number(selectedToken.decimals)),
        
          );

          console.log("Quote Data:", quoteData);

          // Execute swap
          const swapResponse = await fetch("https://api.jup.ag/swap/v1/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteResponse: quoteData,
              userPublicKey: publicKey.toString(),
              dynamicComputeUnitLimit: true,
              prioritizationFeeLamports: {
                priorityLevelWithMaxLamports: {
                  maxLamports: 200000,
                  priorityLevel: "medium",
                },
              },
            }),
            signal: abortController.signal,
          });

          clearTimeout(timeoutId);
          if (!swapResponse.ok) {
            throw new Error(
              `API Error: ${swapResponse.status} - ${await swapResponse.text()}`
            );
          }

          const swapData = await swapResponse.json();
          if (!swapData?.swapTransaction) {
            throw new Error("Invalid swap response from API");
          }

   
          const transaction = VersionedTransaction.deserialize(
            Buffer.from(swapData.swapTransaction, "base64")
          );
          const signedTransaction = await signTransaction(transaction);
          const transactionBinary = signedTransaction.serialize();

          const signature = await connection.sendRawTransaction(
            transactionBinary,
            {
              maxRetries: 2,
              skipPreflight: false,
            }
          );

          const confirmation = await connection.confirmTransaction(
            { signature, ...(await connection.getLatestBlockhash()) },
            "finalized"
          );

          if (confirmation.value.err) {
            throw new Error(
              `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
            );
          }

          toast.success(
            `Transaction successful: https://solscan.io/tx/${signature}/`
          );
          console.log(
            `Transaction successful: https://solscan.io/tx/${signature}`
          );

          setIsSwapping(false);
          return signature;
        } catch (error) {
          clearTimeout(timeoutId);
          lastError = error;

          const { shouldRetry, delay } = handleRetryLogic(
            error,
            retryCount,
            INITIAL_DELAY
          );
          if (!shouldRetry || retryCount >= MAX_RETRIES - 1) {
            console.error("Swap failed after maximum retries:", lastError);
            break;
          }

          console.log(`Retrying in ${delay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
        } finally {
         
        }
      }

      setIsSwapping(false);
      throw lastError;
    } catch (error) {
      console.error("Swap execution failed:", error);
      setIsSwapping(false);
      throw error;
    }
  };



  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="relative w-[35%] h-[85vh] flex flex-col gap-3">
        <div
          className="absolute top-[44.3%] left-[50%] w-[33px] h-[33px] items-center flex justify-center border-[1px] rounded-md z-1 bg-[#141414] transform -translate-x-1/2 "
          onClick={handleTokensSwap}
        >
          <BsArrowDown size={22} color="white" />
        </div>
        <p className="text-[28px] text-white text-center font-medium">
          STAY INVISIBLE
        </p>
        <div className="w-full rounded-[18px] border h-[33%] p-6 bg-[#101012]">
          <p className="mb-2 text-[14px] text-[#CDCDCF] font-semibold">SELL</p>
          <div className="flex justify-between items-center text-white">
            <input
              type="number"
              value={amount}
              placeholder="0"
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-[25px] font-semibold bg-transparent border-none outline-none overflow-none"
            />

            {/* TokenSelector */}

            <div className="relative">
              {/* Search Bar (Click to Open Modal) */}
              <button
                className="w-full flex items-center px-4 py-2 gap-2 border border-gray-600 rounded-md bg-gray-800 text-white"
                onClick={() => setIsOpen(true)}
              >
                <img
                  src={selectedToken?.logo}
                  alt={selectedToken?.symbol}
                  className="w-6 h-6 mr-1 rounded-full"
                />
                {selectedToken?.symbol}
                <IoIosArrowDown />
              </button>

              {/* Modal */}
              {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-gray-900 p-5 rounded-lg w-[35%]">
                    <div className="flex justify-between">
                      <h2 className="text-white text-lg">Select a Token</h2>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Input */}
                    <input
                      type="text"
                      // value={query}
                      placeholder="Search token..."
                      className="outline-none w-full mt-3 px-3 py-2 rounded-md bg-gray-800 text-white "
                      onChange={(e) => setQuery(e.target.value)}
                    />

                    {/* Token List */}
                    <div className="mt-3 max-h-60 overflow-y-auto">
                      {filteredTokens.map((token) => (
                        <button
                          key={token.address}
                          className="w-full flex items-center px-4 py-2 hover:bg-gray-700 rounded-md text-white"
                          onClick={() => {
                            setSelectedToken(token);
                            setIsOpen(false);
                          }}
                        >
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-6 h-6 mr-2 rounded-full"
                          />
                          {token.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Token Selector End  */}
          </div>
          <div className="w-full mx-auto items-center flex justify-between mt-8">
            <p className="font-semibold text-[15px]">
              ${(amount ?? 0) * firstTokenPrice}
            </p>
            <div className="flex gap-2.5 items-center">
              <IoWallet size={23} />
              <span className="text-[15px]">1.2415</span>
              <div className="w-[45px] h-[25px] rounded-md font-semibold flex items-center justify-center text-[14px] bg-[#262628]">
                <span className="text-[12px] font-semibold">MAX</span>
              </div>
            </div>
          </div>
        </div>

        {/* BUY SECTION  */}

        <div className="w-full rounded-[18px] border h-[33%] p-6 bg-[#101012]">
          <p className="mb-2 text-[14px] font-semibold text-[#CDCDCF] ">BUY</p>
          <div className="flex justify-between items-center">
            <input
              type="number"
              value={secondAmount}
              placeholder="0"
              onChange={(e) => setSecondAmount(Number(e.target.value))}
              className="text-[25px] font-semibold bg-transparent border-none outline-none overflow-none text-white"
            />

            {/* TokenSelector */}

            <div className="relative">
              {/* Search Bar (Click to Open Modal) */}
              <button
                className="w-full flex items-center px-4 py-2 gap-2 border border-gray-600 rounded-md bg-gray-800 text-white"
                onClick={() => setIsSecondOpen(true)}
              >
                <img
                  src={secondSelectedToken?.logo}
                  alt={secondSelectedToken?.symbol}
                  className="w-6 h-6 mr-1 rounded-full"
                />
                {secondSelectedToken?.symbol}
                <IoIosArrowDown />
              </button>

              {/* Modal */}
              {isSecondOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-gray-900 p-5 rounded-lg w-[35%]">
                    <div className="flex justify-between">
                      <h2 className="text-white text-lg">Select a Token</h2>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Input */}
                    <input
                      type="text"
                      // value={query}
                      placeholder="Search token..."
                      className="outline-none w-full mt-3 px-3 py-2 rounded-md bg-gray-800 text-white "
                      onChange={(e) => setQuery(e.target.value)}
                    />

                    {/* Token List */}
                    <div className="mt-3 max-h-60 overflow-y-auto">
                      {filteredTokens.map((token) => (
                        <button
                          key={token.address}
                          className="w-full flex items-center px-4 py-2 hover:bg-gray-700 rounded-md text-white"
                          onClick={() => {
                            setSecondSelectedToken(token);
                            setIsSecondOpen(false);
                          }}
                        >
                          <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-6 h-6 mr-2 rounded-full"
                          />
                          {token.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Token Selector End  */}
          </div>
          <div className="w-full mx-auto items-center flex justify-between mt-8">
            <p className="font-semibold text-[15px]">
              $ {secondAmount * secondTokenPrice}
            </p>
            <div className="flex gap-2.5 items-center">
              <IoWallet size={23} />
              <div className="w-[45px] h-[25px] rounded-md font-semibold flex items-center justify-center text-[14px] bg-[#262628]">
                <span className="text-[12px] font-semibold">MAX</span>
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-full rounded-[10px] flex items-center justify-center bg-white text-black h-[50px] text-[16px] cursor-pointer font-medium"
          onClick={connected ? handleSwap : handleWalletConnect}
          disabled={isSwapping}
        >
          {isSwapping
            ? "Swapping..."
            : !connected
            ? "CONNECT WALLET"
            : amount === null
            ? "Enter an Amount"
            : "Swap"}
        </button>

        <div className="" style={{
          display: "none"
        }}><WalletMultiButton/></div>
      </div>
    </div>
  );
}
