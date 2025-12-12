"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Outbound } from "@/types/outbound";
import { format, differenceInMinutes } from "date-fns";
import { Clock, Package, Zap, Timer } from "lucide-react";

interface OutboundOperatorPerformanceProps {
  outbounds: Outbound[];
}

interface OperatorStats {
  operatorId: number;
  operatorName: string;
  username: string;
  totalOutbounds: number;
  firstOutbound: Date;
  lastOutbound: Date;
  totalMinutes: number;
  outboundsPerHour: number;
  averageTimeBetweenOutbounds: number;
}

export function OutboundOperatorPerformance({
  outbounds,
}: OutboundOperatorPerformanceProps) {
  const calculateOperatorStats = (): OperatorStats[] => {
    const operatorMap = new Map<number, Outbound[]>();

    // Group outbounds by operator
    outbounds.forEach((outbound) => {
      if (outbound.outbound_operator) {
        const operatorId = outbound.outbound_operator.id;
        if (!operatorMap.has(operatorId)) {
          operatorMap.set(operatorId, []);
        }
        operatorMap.get(operatorId)?.push(outbound);
      }
    });

    // Calculate stats for each operator
    const stats: OperatorStats[] = [];

    operatorMap.forEach((outbounds, operatorId) => {
      const operator = outbounds[0].outbound_operator!;
      // Sort outbounds by creation date
      const sortedOutbounds = [...outbounds].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const firstOutbound = new Date(sortedOutbounds[0].created_at);
      const lastOutbound = new Date(
        sortedOutbounds[sortedOutbounds.length - 1].created_at
      );

      const totalMinutes = differenceInMinutes(lastOutbound, firstOutbound);
      const totalHours = totalMinutes / 60 || 1; // Prevent division by zero

      // Calculate average time between outbounds
      let totalTimeBetween = 0;
      for (let i = 1; i < sortedOutbounds.length; i++) {
        const diff = differenceInMinutes(
          new Date(sortedOutbounds[i].created_at),
          new Date(sortedOutbounds[i - 1].created_at)
        );
        totalTimeBetween += diff;
      }
      const averageTimeBetweenOutbounds =
        sortedOutbounds.length > 1
          ? totalTimeBetween / (sortedOutbounds.length - 1)
          : 0;

      stats.push({
        operatorId,
        operatorName: operator.full_name,
        username: operator.username,
        totalOutbounds: outbounds.length,
        firstOutbound,
        lastOutbound,
        totalMinutes,
        outboundsPerHour: outbounds.length / totalHours,
        averageTimeBetweenOutbounds,
      });
    });

    // Sort by total outbounds (descending)
    return stats.sort((a, b) => b.totalOutbounds - a.totalOutbounds);
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
              <div className="grid grid-cols-4 gap-4">
                {/* Total Outbounds */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Total Outbounds</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.totalOutbounds}
                  </p>
                </div>

                {/* Outbounds per Hour */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs">Outbounds/Hour</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {stat.outboundsPerHour.toFixed(2)}
                  </p>
                </div>

                {/* Avg Time Between */}
                <div className="space-y-1">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <span className="text-xs">Avg Time</span>
                  </div>
                  <p className="text-xl font-bold text-center">
                    {formatMinutes(stat.averageTimeBetweenOutbounds)}
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
                  {format(stat.firstOutbound, "HH:mm:ss")}
                </span>
                <span> → </span>
                <span className="font-medium">
                  {format(stat.lastOutbound, "HH:mm:ss")}
                </span>
                <span className="ml-2">
                  ({format(stat.firstOutbound, "dd MMM yyyy")})
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {operatorStats.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No outbound data available for performance analysis
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
