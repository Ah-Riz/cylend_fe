"use client";

import { Card } from "@/components/ui/card";
import { HolographicCard } from "@/components/animations/HolographicCard";
import { CryptoGlitch } from "@/components/animations/CryptoGlitch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePools } from "@/hooks/usePools";
import { useSettlementRecords } from "@/hooks/useSettlementRecords";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: pools, isLoading: poolsLoading } = usePools();
  const { data: records, isLoading: recordsLoading } = useSettlementRecords();

  // Calculate metrics from pools data
  const metrics = useMemo(() => {
    if (!pools || pools.length === 0) {
      return [
        {
          label: "Total allocated",
          value: "$0",
          change: "0%",
        },
        {
          label: "Total outstanding credit",
          value: "$0",
          change: "0%",
        },
        {
          label: "Net exposure",
          value: "$0",
          change: "0%",
        },
        {
          label: "Portfolio health",
          value: "100%",
          change: "0%",
        },
      ];
    }

    // Sum up all pools using formatted (human-readable) values to avoid decimal issues
    // For a real app, we would multiply by price. Here we assume 1 token = $1 for simplicity if price is missing.
    const totalAllocated = pools.reduce((sum, pool) => {
      const amount = parseFloat(pool.totalDepositedFormatted.replace(/,/g, ''));
      return sum + amount;
    }, 0);

    const totalBorrowed = pools.reduce((sum, pool) => {
      const amount = parseFloat(pool.totalBorrowedFormatted.replace(/,/g, ''));
      return sum + amount;
    }, 0);

    const netExposure = totalAllocated - totalBorrowed;

    // Calculate portfolio health (simplified: based on utilization)
    const avgUtilization = pools.reduce((sum, pool) => sum + pool.utilization, 0) / pools.length;
    const portfolioHealth = Math.max(0, 100 - avgUtilization);

    // Beautiful format: $2.5M, $450K etc.
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(value);
    };

    return [
      {
        label: "Total allocated",
        value: formatCurrency(totalAllocated),
        change: "+0%",
      },
      {
        label: "Total outstanding credit",
        value: formatCurrency(totalBorrowed),
        change: "+0%",
      },
      {
        label: "Net exposure",
        value: formatCurrency(netExposure),
        change: "0%",
      },
      {
        label: "Portfolio health",
        value: `${portfolioHealth.toFixed(1)}%`,
        change: "+0%",
      },
    ];
  }, [pools]);

  // Get recent records (last 3)
  const recentRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records.slice(0, 3);
  }, [records]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Institutional overview of exposure and portfolio health.
        </p>
      </div>

      {/* Privacy banner */}
      <Card className="p-4 border-primary/30 bg-primary/5">
        <div className="space-y-1">
          <div className="font-medium">Privacy: Always On</div>
          <p className="text-sm text-muted-foreground">
            Allocation instructions and counterparties are evaluated privately on Oasis Sapphire. Settlement remains observable on Mantle.
          </p>
        </div>
      </Card>

      {/* Metrics grid */}
      {poolsLoading ? (
        <div className="flex items-center justify-center py-12">
          <BlockchainLoader size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {metrics.map((metric, index) => (
            <HolographicCard key={index} className={`stagger-${index + 1}`}>
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-end mb-2 md:mb-4">
                  <span className={`text-xs ${metric.change.startsWith('+') ? 'text-success' : metric.change.startsWith('-') ? 'text-destructive' : ''}`}>
                    {metric.change}
                  </span>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <CryptoGlitch
                    text={metric.value}
                    className="text-lg md:text-2xl font-medium"
                  />
                  <div className="text-xs md:text-sm text-muted-foreground">{metric.label}</div>
                </div>
              </div>
            </HolographicCard>
          ))}
        </div>
      )}

      {/* Recent settlement records */}
      <Card className="p-4 md:p-6 animate-slide-up-delayed">
        <h2 className="text-lg md:text-xl font-medium mb-4">Recent Settlement Records</h2>
        {recordsLoading ? (
          <div className="flex items-center justify-center py-12">
            <BlockchainLoader size="lg" />
          </div>
        ) : !recentRecords || recentRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No recent settlement records.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[600px] px-4 md:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vault</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRecords.map((record) => (
                    <TableRow key={record.actionId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{record.date}</TableCell>
                      <TableCell>{record.direction}</TableCell>
                      <TableCell>
                        <span className="font-medium">{record.asset}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.amountFormatted}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={record.status === "Settled" ? "default" : record.status === "Released" ? "secondary" : "destructive"}
                          className={
                            record.status === "Settled"
                              ? "bg-success/10 text-success border-success/30"
                              : record.status === "Released"
                                ? "bg-secondary text-secondary-foreground"
                                : record.status === "Failed"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : ""
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.vault}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
