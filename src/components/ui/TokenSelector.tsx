"use client"

import React, { useState } from "react";

const tokens = [
  {
    symbol: "SOL",
    name: "Solana",
    icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    icon: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    icon: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    icon: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  },
];

const TokenSelector = () => {
  const [query, setQuery] = useState("");
  const [selectedToken, setSelectedToken] = useState(tokens[0]);
  const [isOpen, setIsOpen] = useState(false);

  // Filter tokens based on search query
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(query.toLowerCase()) ||
      token.symbol.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      {/* Search Bar (Click to Open Modal) */}
      <button
        className="w-full flex items-center px-4 py-2 border border-gray-600 rounded-md bg-gray-800 text-white"
        onClick={() => setIsOpen(true)}
      >
        <img
          src={selectedToken.icon}
          alt={selectedToken.symbol}
          className="w-6 h-6 mr-2 rounded-full"
        />
        {selectedToken.symbol}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 p-5 rounded-lg w-80">
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
              value={query}
              placeholder="Search token..."
              className="w-full mt-3 px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600"
              onChange={(e) => setQuery(e.target.value)}
            />

            {/* Token List */}
            <div className="mt-3 max-h-60 overflow-y-auto">
              {filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  className="w-full flex items-center px-4 py-2 hover:bg-gray-700 rounded-md text-white"
                  onClick={() => {
                    setSelectedToken(token);
                    setIsOpen(false);
                    setQuery(""); // Reset search query
                  }}
                >
                  <img
                    src={token.icon}
                    alt={token.symbol}
                    className="w-6 h-6 mr-2 rounded-full"
                  />
                  {token.symbol} ({token.name})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;
