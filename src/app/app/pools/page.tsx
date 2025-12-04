"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function Pools() {
  const pools = [
    {
      asset: "USDC",
      icon: "💵",
      liquidity: "12,450,000",
      utilization: "76.2%",
      lendAPY: "5.8%",
      borrowAPR: "8.4%",
      tvp: "9,482,400",
    },
    {
      asset: "MNT",
      icon: "⛰️",
      liquidity: "8,920,000",
      utilization: "62.5%",
      lendAPY: "4.2%",
      borrowAPR: "6.8%",
      tvp: "5,575,000",
    },
    {
      asset: "WETH",
      icon: "💎",
      liquidity: "4,680,000",
      utilization: "54.8%",
      lendAPY: "3.9%",
      borrowAPR: "6.2%",
      tvp: "2,564,640",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Pools</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Each pool holds capital in Cylend Escrow on Mantle. Credit decisions for releases are taken inside the vault.
        </p>
      </div>

      {/* Pools table */}
      <Card className="p-4 md:p-6">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[800px] px-4 md:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Total Liquidity</TableHead>
              <TableHead className="text-right">Utilization</TableHead>
              <TableHead className="text-right">Lend APY</TableHead>
              <TableHead className="text-right">Borrow APR</TableHead>
              <TableHead className="text-right">TVP</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pools.map((pool, index) => (
              <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pool.icon}</span>
                    <span className="font-medium">{pool.asset}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseInt(pool.liquidity.replace(/,/g, '')).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {pool.utilization}
                </TableCell>
                <TableCell className="text-right font-mono text-success">
                  {pool.lendAPY}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {pool.borrowAPR}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  ${parseInt(pool.tvp.replace(/,/g, '')).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href="/app/allocate">
                      <Button size="sm" variant="default">
                        Allocate capital
                      </Button>
                    </Link>
                    <Link href="/app/repay">
                      <Button size="sm" variant="secondary">
                        Access credit
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>
              TVP: Total Value Protected via Cylend. Represents capital with privacy-preserving credit decisioning.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
