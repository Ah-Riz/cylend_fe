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
import { usePools } from "@/hooks/usePools";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import { TokenIcon } from "@/components/ui/token-icon";

export default function Pools() {
  const { data: pools, isLoading, error } = usePools();

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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <BlockchainLoader size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            Error loading pools data. Please try again later.
          </div>
        ) : !pools || pools.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No pools available.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[1200px] px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px] text-base md:text-sm font-semibold">Asset</TableHead>
                    <TableHead className="text-right min-w-[160px] text-base md:text-sm font-semibold">Total Liquidity</TableHead>
                    <TableHead className="text-right min-w-[120px] text-base md:text-sm font-semibold">Utilization</TableHead>
                    <TableHead className="text-right min-w-[110px] text-base md:text-sm font-semibold">Lend APY</TableHead>
                    <TableHead className="text-right min-w-[120px] text-base md:text-sm font-semibold">Borrow APR</TableHead>
                    <TableHead className="text-right min-w-[140px] text-base md:text-sm font-semibold">TVP</TableHead>
                    <TableHead className="text-right min-w-[320px] text-base md:text-sm font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool, index) => (
                    <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="py-5 md:py-3">
                        <div className="flex items-center gap-4">
                          <TokenIcon symbol={pool.symbol as 'MNT' | 'WMNT' | 'USDC' | 'USDT'} size={44} className="md:w-8 md:h-8" />
                          <span className="font-medium text-lg md:text-base">{pool.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-base md:text-sm py-5 md:py-3">
                        {pool.totalDepositedFormatted} {pool.symbol}
                      </TableCell>
                      <TableCell className="text-right font-mono text-base md:text-sm py-5 md:py-3">
                        {pool.utilizationFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success text-base md:text-sm py-5 md:py-3">
                        {pool.lendAPYFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-base md:text-sm py-5 md:py-3">
                        {pool.borrowAPRFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground text-base md:text-sm py-5 md:py-3">
                        {pool.tvpFormatted} {pool.symbol}
                      </TableCell>
                      <TableCell className="text-right py-5 md:py-3">
                        <div className="flex justify-end gap-3">
                          <Link href="/app/allocate">
                            <Button size="lg" variant="default" className="h-12 md:h-9 text-base md:text-sm px-5 md:px-4">
                              Allocate capital
                            </Button>
                          </Link>
                          <Link href="/app/borrow">
                            <Button size="lg" variant="secondary" className="h-12 md:h-9 text-base md:text-sm px-5 md:px-4">
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
        )}

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
