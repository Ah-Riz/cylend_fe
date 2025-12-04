"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar } from "lucide-react";

export default function SettlementRecords() {
  const records = [
    {
      date: "2025-11-29 14:32",
      direction: "Release",
      asset: "USDC",
      amount: "50,000",
      status: "Settled",
      vault: "Sapphire",
    },
    {
      date: "2025-11-29 11:18",
      direction: "Repayment",
      asset: "MNT",
      amount: "125,000",
      status: "Settled",
      vault: "Sapphire",
    },
    {
      date: "2025-11-28 16:45",
      direction: "Allocation",
      asset: "USDC",
      amount: "200,000",
      status: "Released",
      vault: "Sapphire",
    },
    {
      date: "2025-11-28 09:22",
      direction: "Release",
      asset: "WETH",
      amount: "15,000",
      status: "Settled",
      vault: "Sapphire",
    },
    {
      date: "2025-11-27 15:38",
      direction: "Allocation",
      asset: "MNT",
      amount: "300,000",
      status: "Released",
      vault: "Sapphire",
    },
    {
      date: "2025-11-27 10:12",
      direction: "Release",
      asset: "USDC",
      amount: "75,000",
      status: "Compliance check failed",
      vault: "Sapphire",
    },
  ];

  const getStatusVariant = (status: string) => {
    if (status === "Settled") return "default";
    if (status === "Released") return "secondary";
    if (status === "Compliance check failed") return "destructive";
    return "secondary";
  };

  const hasFailures = records.some(r => r.status === "Compliance check failed");

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">Settlement Records</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Institutional ledger of settlement activity. Counterparties and policy checks remain confidential.
        </p>
      </div>

      {/* Failure banner */}
      {hasFailures && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 animate-slide-up">
          <div className="space-y-2">
            <div className="font-medium">Compliance check failed.</div>
            <p className="text-sm text-muted-foreground">
              This instruction did not meet the vault&apos;s policy. No funds were released. Please review internal credit criteria.
            </p>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Filters</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Date range</label>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Last 7 days
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Asset</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assets</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="mnt">MNT</SelectItem>
                <SelectItem value="weth">WETH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Direction</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="allocation">Allocation</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="failed">Compliance check failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card className="p-4 md:p-6">
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[700px] px-4 md:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / Time</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vault Route</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, index) => (
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
                  <Badge
                    variant={getStatusVariant(record.status) as "default" | "secondary" | "destructive"}
                    className={
                      record.status === "Settled"
                        ? "bg-success/10 text-success border-success/30"
                        : record.status === "Released"
                        ? "bg-secondary text-secondary-foreground"
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

        <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
          This view reflects settlement activity on Mantle. Counterparties, memos, and policy checks remain inside the vault.
        </div>
      </Card>
    </div>
  );
}
