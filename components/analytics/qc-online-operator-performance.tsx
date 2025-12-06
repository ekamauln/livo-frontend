"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QcOnline } from "@/types/qc-online";
import { format, differenceInMinutes } from "date-fns";
import { Activity, TrendingUp, Clock, Package, Zap, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QcOperatorPerformanceProps {
  qcOnlines: QcOnline[];
}

interface OperatorStats {
  operatorId: number;
  operatorName: string;
  username: string;
  totalOnlines: number;
  totalItems: number;
  averageItemsPerOnline: number;
  firstOnline: Date;
  lastOnline: Date;
  totalMinutes: number;
  onlinesPerHour: number;
  itemsPerHour: number;
  averageTimeBetweenOnlines: number;
}

export function QcOperatorPerformance({
  qcOnlines,
}: QcOperatorPerformanceProps) {
  const calculateOperatorStats = (): OperatorStats[] => {
    const operatorMap = new Map<number, QcOnline[]>();

    // Group ribbons by operator
    qcOnlines.forEach((online) => {
      if (online.qc_operator) {
        const operatorId = online.qc_operator.id;
        if (!operatorMap.has(operatorId)) {
          operatorMap.set(operatorId, []);
        }
        operatorMap.get(operatorId)?.push(online);
      }
    });

    // Calculate stats for each operator
    const stats: OperatorStats[] = [];

    operatorMap.forEach((onlines, operatorId) => {
      const operator = onlines[0].qc_operator!;
      // Sort onlines by creation date
      const sortedOnlines = [...onlines].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const firstOnline = new Date(sortedOnlines[0].created_at);
      const lastOnline = new Date(
        sortedOnlines[sortedOnlines.length - 1].created_at
      );

      const totalMinutes = differenceInMinutes(lastOnline, firstOnline);
      const totalHours = totalMinutes / 60 || 1; // Prevent division by zero

      // Calculate total items
      const totalItems = onlines.reduce((sum, online) => {
        return (
          sum +
          (online.qc_online_details?.reduce(
            (detailSum, detail) => detailSum + detail.quantity,
            0
          ) || 0)
        );
      }, 0);

      // Calculate average time between onlines
      let totalTimeBetween = 0;
      for (let i = 1; i < sortedOnlines.length; i++) {
        const diff = differenceInMinutes(
          new Date(sortedOnlines[i].created_at),
          new Date(sortedOnlines[i - 1].created_at)
        );
        totalTimeBetween += diff;
      }
      const averageTimeBetweenOnlines =
        sortedOnlines.length > 1
          ? totalTimeBetween / (sortedOnlines.length - 1)
          : 0;

      stats.push({
        operatorId,
        operatorName: operator.full_name,
        username: operator.username,
        totalOnlines: onlines.length,
        totalItems,
        averageItemsPerOnline: totalItems / onlines.length,
        firstOnline,
        lastOnline,
        totalMinutes,
        onlinesPerHour: onlines.length / totalHours,
        itemsPerHour: totalItems / totalHours,
        averageTimeBetweenOnlines,
      });
    });

    // Sort by total onlines (descending)
    return stats.sort((a, b) => b.totalOnlines - a.totalOnlines);
  };

  const operatorStats = calculateOperatorStats();

  const formatMinutes = (minutes: number): string => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {operatorStats.map((stat) => (
          <Card key={stat.operatorId} className="rounded-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{stat.operatorName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    @{stat.username}
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-bold">
                  {stat.totalOnlines} QC&apos;s
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Items */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Total Items</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.totalItems}
                  </p>
                </div>

                {/* Average Items/Online */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Avg Items/QC</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.averageItemsPerOnline.toFixed(1)}
                  </p>
                </div>

                {/* Onlines per Hour */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">QCs/Hour</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.onlinesPerHour.toFixed(2)}
                  </p>
                </div>

                {/* Items per Hour */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Items/Hour</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.itemsPerHour.toFixed(1)}
                  </p>
                </div>

                {/* Avg Time Between */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs">Avg Time</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {formatMinutes(stat.averageTimeBetweenOnlines)}
                  </p>
                </div>

                {/* Working Duration */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs">Duration</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {formatMinutes(stat.totalMinutes)}
                  </p>
                </div>
              </div>

              {/* Time Range */}
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <span>Working period: </span>
                <span className="font-medium">
                  {format(stat.firstOnline, "HH:mm:ss")}
                </span>
                <span> → </span>
                <span className="font-medium">
                  {format(stat.lastOnline, "HH:mm:ss")}
                </span>
                <span className="ml-2">
                  ({format(stat.firstOnline, "dd MMM yyyy")})
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {operatorStats.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No QC ribbon data available for performance analysis
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
