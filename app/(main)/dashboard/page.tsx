"use client";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { getRoleBadgeStyle } from "@/components/custom-ui/role-badge-style";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { House } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from "@/contexts/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { UserChargeFeeWidget } from "@/components/widgets/user-charge-fee-widget";
// import { MbOnlinesChartWidget } from "@/components/widgets/mb-onlines-chart-widget";
// import { OutboundsChartWidget } from "@/components/widgets/outbounds-chart-widget";
// import { QcOnlinesChartWidget } from "@/components/widgets/qc-onlines-chart-widget";
// import { PcOnlinesChartWidget } from "@/components/widgets/pc-onlines-chart-widget";
// import { MbRibbonsChartWidget } from "@/components/widgets/mb-ribbons-chart-widget";
// import { QcRibbonsChartWidget } from "@/components/widgets/qc-ribbons-chart-widget";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns/format";

export default function Page() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <header className="flex h-16 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <Link href="/">
              <House size="16" className="text-muted-foreground" />
            </Link>
            {/* Icon */}
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbPage className="text-muted-foreground">
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <p className="mt-2">
            Welcome back,{" "}
            <span className="underline">
              {user?.full_name || user?.username}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 grid-cols-2">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="underline">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md gap-4">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="w-1/4">ID</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.id}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Username</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.username}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Email</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.email}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Full Name</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.full_name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Status</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          <Badge
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              user?.is_active
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                          >
                            {user?.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="w-1/4">Created</TableCell>
                        <TableCell className="w-3/4 text-wrap">
                          {user?.created_at
                            ? format(user.created_at, "dd MMMM yyyy - HH:mm:ss")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="underline">Assigned Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user?.roles?.map((role) => (
                    <Item key={role.id} variant="outline">
                      <ItemContent>
                        <ItemTitle>
                          <span className="capitalize">{role.name}</span>
                        </ItemTitle>
                        <ItemDescription>{role.description}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Badge
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getRoleBadgeStyle(
                            role.name
                          )}`}
                        >
                          {role.name}
                        </Badge>
                      </ItemActions>
                    </Item>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* MB Onlines Chart Widget */}
            <div>{/* <MbOnlinesChartWidget /> */}</div>

            {/* QC Onlines Chart Widget */}
            <div>{/* <QcOnlinesChartWidget /> */}</div>

            {/* PC Onlines Chart Widget */}
            <div>{/* <PcOnlinesChartWidget /> */}</div>
          </div>

          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            {/* MB Ribbons Chart Widget */}
            <div>{/* <MbRibbonsChartWidget /> */}</div>

            {/* QC Ribbons Chart Widget */}
            <div>{/* <QcRibbonsChartWidget /> */}</div>

            {/* Outbounds Chart Widget */}
            <div>{/* <OutboundsChartWidget /> */}</div>
          </div>

          {/* User Charge Fee Widget */}
          {user?.id && (
            <div>{/* <UserChargeFeeWidget userId={user.id} /> */}</div>
          )}

          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
