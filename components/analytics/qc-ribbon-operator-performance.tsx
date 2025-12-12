"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QcRibbon } from "@/types/qc-ribbon";
import { format, differenceInMinutes } from "date-fns";
import { Activity, TrendingUp, Clock, Package, Zap, Timer } from "lucide-react";

interface QcOperatorPerformanceProps {
  qcRibbons: QcRibbon[];
}

interface OperatorStats {
  operatorId: number;
  operatorName: string;
  username: string;
  totalRibbons: number;
  totalItems: number;
  averageItemsPerRibbon: number;
  firstRibbon: Date;
  lastRibbon: Date;
  totalMinutes: number;
  ribbonsPerHour: number;
  itemsPerHour: number;
  averageTimeBetweenRibbons: number;
}

export function QcOperatorPerformance({
  qcRibbons,
}: QcOperatorPerformanceProps) {
  const calculateOperatorStats = (): OperatorStats[] => {
    const operatorMap = new Map<number, QcRibbon[]>();

    // Group ribbons by operator
    qcRibbons.forEach((ribbon) => {
      if (ribbon.qc_operator) {
        const operatorId = ribbon.qc_operator.id;
        if (!operatorMap.has(operatorId)) {
          operatorMap.set(operatorId, []);
        }
        operatorMap.get(operatorId)?.push(ribbon);
      }
    });

    // Calculate stats for each operator
    const stats: OperatorStats[] = [];

    operatorMap.forEach((ribbons, operatorId) => {
      const operator = ribbons[0].qc_operator!;

      // Sort ribbons by creation date
      const sortedRibbons = [...ribbons].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const firstRibbon = new Date(sortedRibbons[0].created_at);
      const lastRibbon = new Date(
        sortedRibbons[sortedRibbons.length - 1].created_at
      );

      const totalMinutes = differenceInMinutes(lastRibbon, firstRibbon);
      const totalHours = totalMinutes / 60 || 1; // Prevent division by zero

      // Calculate total items
      const totalItems = ribbons.reduce((sum, ribbon) => {
        return (
          sum +
          (ribbon.qc_ribbon_details?.reduce(
            (detailSum, detail) => detailSum + detail.quantity,
            0
          ) || 0)
        );
      }, 0);

      // Calculate average time between ribbons
      let totalTimeBetween = 0;
      for (let i = 1; i < sortedRibbons.length; i++) {
        const diff = differenceInMinutes(
          new Date(sortedRibbons[i].created_at),
          new Date(sortedRibbons[i - 1].created_at)
        );
        totalTimeBetween += diff;
      }
      const averageTimeBetweenRibbons =
        sortedRibbons.length > 1
          ? totalTimeBetween / (sortedRibbons.length - 1)
          : 0;

      stats.push({
        operatorId,
        operatorName: operator.full_name,
        username: operator.username,
        totalRibbons: ribbons.length,
        totalItems,
        averageItemsPerRibbon: totalItems / ribbons.length,
        firstRibbon,
        lastRibbon,
        totalMinutes,
        ribbonsPerHour: ribbons.length / totalHours,
        itemsPerHour: totalItems / totalHours,
        averageTimeBetweenRibbons,
      });
    });

    // Sort by total ribbons (descending)
    return stats.sort((a, b) => b.totalRibbons - a.totalRibbons);
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

                {/* Average Items/Ribbon */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs">Avg Items/QC</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.averageItemsPerRibbon.toFixed(1)}
                  </p>
                </div>

                {/* Ribbons per Hour */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">QCs/Hour</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.ribbonsPerHour.toFixed(2)}
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
                    {formatMinutes(stat.averageTimeBetweenRibbons)}
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
                  {format(stat.firstRibbon, "HH:mm:ss")}
                </span>
                <span> → </span>
                <span className="font-medium">
                  {format(stat.lastRibbon, "HH:mm:ss")}
                </span>
                <span className="ml-2">
                  ({format(stat.firstRibbon, "dd MMM yyyy")})
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
