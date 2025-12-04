"use client";

import { Card } from "@/components/ui/card";
import { Shield, TrendingUp, Activity, AlertCircle } from "lucide-react";
import { HolographicCard } from "@/components/animations/HolographicCard";
import { CryptoGlitch } from "@/components/animations/CryptoGlitch";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const metrics = [
    {
      label: "Total allocated",
      value: "$2,450,000",
      icon: TrendingUp,
      change: "+12.5%",
    },
    {
      label: "Total outstanding credit",
      value: "$1,890,000",
      icon: Activity,
      change: "+8.2%",
    },
    {
      label: "Net exposure",
      value: "$560,000",
      icon: AlertCircle,
      change: "-3.1%",
    },
    {
      label: "Portfolio health",
      value: "98.5%",
      icon: Shield,
      change: "+0.3%",
    },
  ];

  const recentRecords = [
    {
      date: "2025-11-29 14:32",
      direction: "Release",
      asset: "USDC",
      amount: "50,000",
      status: "Settled",
    },
    {
      date: "2025-11-29 11:18",
      direction: "Repayment",
      asset: "MNT",
      amount: "125,000",
      status: "Settled",
    },
    {
      date: "2025-11-28 16:45",
      direction: "Allocation",
      asset: "USDC",
      amount: "200,000",
      status: "Released",
    },
  ];

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
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {metrics.map((metric, index) => (
          <HolographicCard key={index} className={`stagger-${index + 1}`}>
            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <metric.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <span className={`text-xs ${metric.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
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

      {/* Recent settlement records */}
      <Card className="p-4 md:p-6 animate-slide-up-delayed">
        <h2 className="text-lg md:text-xl font-medium mb-4">Recent Settlement Records</h2>
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
            {recentRecords.map((record, index) => (
              <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-sm">{record.date}</TableCell>
                <TableCell>{record.direction}</TableCell>
                <TableCell>
                  <span className="font-medium">{record.asset}</span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${parseInt(record.amount.replace(/,/g, '')).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/30">
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  Sapphire
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
