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
                          <span className="font-medium">{pool.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {pool.totalDepositedFormatted} {pool.symbol}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {pool.utilizationFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-success">
                        {pool.lendAPYFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {pool.borrowAPRFormatted}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {pool.tvpFormatted} {pool.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href="/app/allocate">
                            <Button size="sm" variant="default">
                              Allocate capital
                            </Button>
                          </Link>
                          <Link href="/app/borrow">
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
