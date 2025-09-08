"use client";
import { NavLink as Link } from "react-router";
import { ConnectModal } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shell, Plus, ShoppingBag, Wallet, Copy, Check, UsersRound  } from "lucide-react";
import { motion } from "framer-motion";
import {
  useAccounts,
  useCurrentAccount,
  useDisconnectWallet,
  useResolveSuiNSName,
} from "@mysten/dapp-kit";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { shortenAddress } from "@polymedia/suitcase-core";
import { useState } from "react";
import { toast } from "sonner";


const navLinks : any = [
  /*{
    href: "https://github.com/Sahilgill24/SeaShell",
    label: "Features",
  },*/
];

export function Header() {
  
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 flex justify-center">
      <div className="container flex h-14 items-center justify-between gap-8 px-4 border-l border-r">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Shell className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">SeaShell</span>
        </motion.div>
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:flex gap-6"
        >
          {navLinks.map((link: any) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </motion.nav>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <div className="flex gap-2 items-center">
           <AccountInfo />
          </div>
        </motion.div>
      </div>
    </header>
  );
}

function AccountInfo() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { data: domain } = useResolveSuiNSName(
    currentAccount?.label ? null : currentAccount?.address
  );
  const accounts = useAccounts();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (currentAccount?.address) {
      await navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentAccount) return  <ConnectModal
            trigger={
              <Button size="sm" className="rounded-full">
                Get Started
              </Button>
            }
          />;
  
  return (
    
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full px-4 flex items-center gap-2 hover:bg-accent/50 transition-colors"
        >
          <span className="font-mono font-bold">
            {currentAccount.label ??
              domain ??
              shortenAddress(currentAccount.address)}
          </span>
          <ChevronDownIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem
          onClick={copyAddress}
          className="cursor-pointer hover:bg-accent/50 flex items-center gap-2"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">Copy Address</span>
            <span className="text-xs text-muted-foreground font-mono">
              {shortenAddress(currentAccount.address)}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.address}
            className={
              currentAccount.address === account.address
                ? "bg-accent text-foreground "
                : ""
            }
            disabled={currentAccount.address === account.address}
          >
            {account.label ?? shortenAddress(account.address)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => disconnectWallet()}
          className="text-destructive focus:text-destructive"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    
  );
}