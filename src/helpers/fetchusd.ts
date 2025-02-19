"use client"
import { useEffect, useState } from "react";


interface Token {
  symbol: string;
  logo: string;
  address: string;
  decimals: string;
}
export function useFetchUSD(secondSelectedToken: Token) {
  const [fetchingUSD, setFetchingUSD] = useState(false);
  const [secondTokenPrice, setSecondTokenPrice] = useState<number>(0);

  useEffect(() => {

    setFetchingUSD(true);
    const fetchPrice = async () => {
        setFetchingUSD(true);
        if (secondSelectedToken?.address)
          try {
            const response = await fetch(
              `https://api.jup.ag/price/v2?ids=${secondSelectedToken.address}`
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch tokens: ${response.status}`);
            }

            const data = await response.json();
            setSecondTokenPrice(data.data[`${secondSelectedToken.address}`].price);
            setFetchingUSD(false)
          } catch (error) {
            console.error("Error fetching tokens:", error);
          } finally {
            setFetchingUSD(false);
          }
    };

    fetchPrice();
  }, [secondSelectedToken]);

  return { secondTokenPrice, fetchingUSD };
}
