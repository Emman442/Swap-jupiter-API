import { useRouter } from "next/navigation";
import Link from "next/link";
import { LazorConnect, useWallet} from "@lazorkit/wallet";
import { Connection } from "@solana/web3.js";
import { ellipsify } from "./ui-layout";

const connection = new Connection("https://api.devnet.solana.com");

export function Navbar() {
  const router = useRouter();
  const {publicKey, connect, isConnected, disconnect} = useWallet()
  return (
    <header className="sticky top-0 z-50 w-full bg-black backdrop-blur">
      <div className="container w-[90%] mx-auto flex h-16 items-center justify-between border-b border-b-white/40 border/10">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl text-sky-dark">FlySwap</span>
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            className="px-2 bg-blue-500 py-1 rounded-md text-white"
            onClick={connect}
          >
            {isConnected
              ? `Connected: ${ellipsify(publicKey)}`
              : "Connect Wallet"}
          </button>
          {/* {isConnected && <div>Public Key: {publicKey}</div>} */}

          {publicKey && <button onClick={disconnect}>Disconnect</button>}
        </div>
      </div>
    </header>
  );
}
