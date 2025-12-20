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
import { useSettlementRecords } from "@/hooks/useSettlementRecords";
import { BlockchainLoader } from "@/components/animations/BlockchainLoader";
import { useState, useMemo } from "react";

export default function SettlementRecords() {
  const { data: records, isLoading, error } = useSettlementRecords();
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    
    return records.filter((record) => {
      if (assetFilter !== "all" && record.asset.toLowerCase() !== assetFilter) return false;
      if (directionFilter !== "all" && record.direction.toLowerCase() !== directionFilter) return false;
      if (statusFilter !== "all" && record.status.toLowerCase() !== statusFilter) return false;
      return true;
    });
  }, [records, assetFilter, directionFilter, statusFilter]);

  const hasFailures = filteredRecords.some(r => r.status === "Failed");

  const getStatusVariant = (status: string) => {
    if (status === "Settled") return "default";
    if (status === "Released") return "secondary";
    if (status === "Failed") return "destructive";
    return "secondary";
  };

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
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assets</SelectItem>
                <SelectItem value="usdc">USDC</SelectItem>
                <SelectItem value="usdt">USDT</SelectItem>
                <SelectItem value="wmnt">WMNT</SelectItem>
                <SelectItem value="mnt">MNT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Direction</label>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All directions</SelectItem>
                <SelectItem value="allocation">Allocation</SelectItem>
                <SelectItem value="release">Release</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
                <SelectItem value="liquidation">Liquidation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Records table */}
      <Card className="p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <BlockchainLoader size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            Error loading settlement records. Please try again later.
          </div>
        ) : !filteredRecords || filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No settlement records found.
          </div>
        ) : (
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
                  {filteredRecords.map((record) => (
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
                          variant={getStatusVariant(record.status) as "default" | "secondary" | "destructive"}
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

        <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
          This view reflects settlement activity on Mantle. Counterparties, memos, and policy checks remain inside the vault.
        </div>
      </Card>
    </div>
  );
}
