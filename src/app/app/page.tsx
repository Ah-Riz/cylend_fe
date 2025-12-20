"use client";

import { Card } from "@/components/ui/card";
import { Shield, TrendingUp, Activity, AlertCircle } from "lucide-react";
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
          icon: TrendingUp,
          change: "0%",
        },
        {
          label: "Total outstanding credit",
          value: "$0",
          icon: Activity,
          change: "0%",
        },
        {
          label: "Net exposure",
          value: "$0",
          icon: AlertCircle,
          change: "0%",
        },
        {
          label: "Portfolio health",
          value: "100%",
          icon: Shield,
          change: "0%",
        },
      ];
    }

    // Sum up all pools
    const totalAllocated = pools.reduce((sum, pool) => sum + pool.totalDeposited, 0n);
    const totalBorrowed = pools.reduce((sum, pool) => sum + pool.totalBorrowed, 0n);
    const netExposure = totalAllocated - totalBorrowed;

    // Calculate portfolio health (simplified: based on utilization)
    const avgUtilization = pools.reduce((sum, pool) => sum + pool.utilization, 0) / pools.length;
    const portfolioHealth = Math.max(0, 100 - avgUtilization);

    // Format values - sum all tokens (simplified display)
    // Note: In production, we'd need to convert each token to USD using prices
    const formatValue = (value: bigint) => {
      // For now, display in raw format (will need price oracle for accurate USD conversion)
      if (value === 0n) return "$0";
      const num = Number(value);
      // Format with commas
      return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return [
      {
        label: "Total allocated",
        value: formatValue(totalAllocated),
        icon: TrendingUp,
        change: "+0%", // TODO: Calculate change from previous period
      },
      {
        label: "Total outstanding credit",
        value: formatValue(totalBorrowed),
        icon: Activity,
        change: "+0%", // TODO: Calculate change from previous period
      },
      {
        label: "Net exposure",
        value: formatValue(netExposure),
        icon: AlertCircle,
        change: "0%", // TODO: Calculate change from previous period
      },
      {
        label: "Portfolio health",
        value: `${portfolioHealth.toFixed(1)}%`,
        icon: Shield,
        change: "+0%", // TODO: Calculate change from previous period
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
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-medium">Privacy: Always On</div>
            <p className="text-sm text-muted-foreground">
              Allocation instructions and counterparties are evaluated inside the vault. Settlement remains observable on Mantle.
            </p>
          </div>
        </div>
      </Card>

      {/* Metrics grid */}
      {poolsLoading ? (
        <div className="flex items-center justify-center py-12">
          <BlockchainLoader size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {metrics.map((metric, index) => (
            <HolographicCard key={index} className={`stagger-${index + 1}`}>
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-2 md:mb-4">
                  <metric.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
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
