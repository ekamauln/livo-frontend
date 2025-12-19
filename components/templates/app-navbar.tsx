"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  BookCheck,
  BookOpenCheck,
  FileCheck,
  FolderSearch,
  FolderUp,
  Globe,
  LogOut,
  Package,
  PackageOpen,
  Ribbon,
  ScrollText,
  SquareUser,
  Store,
  Truck,
  Tv,
  User,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ThemeToggleButton,
  useThemeTransition,
} from "@/components/ui/shadcn-io/theme-toggle-button";
import { getRoleBadgeStyle } from "@/components/custom-ui/role-badge-style";

export default function AppNavbar() {
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, hasAnyRole } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Show success even if API fails
    } finally {
      router.replace("/auth/login");
    }
  };

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleThemeToggle = () => {
    startTransition(() => {
      const newTheme = theme === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });
  };

  const currentTheme =
    theme === "system" ? "light" : (theme as "light" | "dark");

  if (!mounted) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex h-16 justify-between items-center gap-2 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-md shadow-md border-b"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2 px-4">
        <div className="font-bold">
          <Link href="/dashboard">LIVOTECH</Link>
        </div>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div>
          <Menubar>
            {/* Components - visible to superadmin, coordinator, admin */}
            {hasAnyRole(["superadmin", "coordinator"]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Components
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/boxes">
                      <PackageOpen className="h-4 w-4" />
                      Boxes
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/channels">
                      <Tv className="h-4 w-4" />
                      Channels
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/expeditions">
                      <Truck className="h-4 w-4" />
                      Expeditions
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/products">
                      <Package className="h-4 w-4" />
                      Products
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/stores">
                      <Store className="h-4 w-4" />
                      Stores
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/components/users-manager">
                      <SquareUser className="h-4 w-4" />
                      Users Manager
                    </Link>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Orders menu - visible to superadmin, coordinator, admin, picker */}
            {hasAnyRole(["superadmin", "coordinator", "admin"]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Orders
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/orders/orders">
                      <ScrollText className="h-4 w-4" />
                      Orders
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/orders/orders-import">
                      <FolderUp className="h-4 w-4" />
                      Orders Import
                    </Link>
                  </MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/orders/assigned-orders">
                      <FolderSearch className="h-4 w-4" />
                      Assign Orders
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/orders/lost-founds">
                      <FolderSearch className="h-4 w-4" />
                      Lost Founds
                    </Link>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Ribbons menu - visible to superadmin, coordinator, admin, retur, qc-ribbon */}
            {hasAnyRole([
              "superadmin",
              "coordinator",
              "admin",
              "retur",
              "qc-ribbon",
            ]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Ribbons
                </MenubarTrigger>
                <MenubarContent>
                  {hasAnyRole(["superadmin", "coordinator", "qc-ribbon"]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/ribbons/qc-ribbons">
                        <Ribbon className="h-4 w-4" />
                        QC Ribbons
                      </Link>
                    </MenubarItem>
                  )}
                  {hasAnyRole(["superadmin", "coordinator"]) && (
                    <MenubarSeparator />
                  )}
                  {hasAnyRole([
                    "superadmin",
                    "coordinator",
                    "admin",
                    "retur",
                  ]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/ribbons/ribbon-flows">
                        <Ribbon className="h-4 w-4" />
                        Ribbon Flows
                      </Link>
                    </MenubarItem>
                  )}
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Onlines menu - visible to superadmin, coordinator, admin, mb-online, qc-online, packing */}
            {hasAnyRole([
              "superadmin",
              "coordinator",
              "admin",
              "retur",
              "qc-online",
            ]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Onlines
                </MenubarTrigger>
                <MenubarContent>
                  {hasAnyRole(["superadmin", "coordinator", "qc-online"]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/onlines/qc-onlines">
                        <Globe className="h-4 w-4" />
                        QC Onlines
                      </Link>
                    </MenubarItem>
                  )}
                  {hasAnyRole(["superadmin", "coordinator"]) && (
                    <MenubarSeparator />
                  )}
                  {hasAnyRole([
                    "superadmin",
                    "coordinator",
                    "admin",
                    "retur",
                  ]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/onlines/online-flows">
                        <Globe className="h-4 w-4" />
                        Online Flows
                      </Link>
                    </MenubarItem>
                  )}
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Outbounds menu - visible to superadmin, coordinator, admin, outbound */}
            {hasAnyRole([
              "superadmin",
              "coordinator",
              "admin",
              "retur",
              "outbound",
            ]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Outbounds
                </MenubarTrigger>
                <MenubarContent>
                  {hasAnyRole(["superadmin", "coordinator", "outbound"]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/outbounds/input-outbounds">
                        <Truck className="h-4 w-4" />
                        Input Outbounds
                      </Link>
                    </MenubarItem>
                  )}
                  {hasAnyRole(["superadmin", "coordinator", "outbound"]) && (
                    <MenubarSeparator />
                  )}
                  {hasAnyRole([
                    "superadmin",
                    "coordinator",
                    "admin",
                    "retur",
                  ]) && (
                    <MenubarItem asChild className="cursor-pointer">
                      <Link href="/outbounds/handout-outbounds">
                        <Truck className="h-4 w-4" />
                        Handout Outbounds
                      </Link>
                    </MenubarItem>
                  )}
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Complains menu - visible to all roles except guest */}
            {hasAnyRole([
              "superadmin",
              "coordinator",
              "admin",
              "retur",
              "finance",
            ]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Complains
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/complains/input-complains">
                      <BookOpenCheck className="h-4 w-4" />
                      Input Complains
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/complains/input-returns">
                      <BookCheck className="h-4 w-4" />
                      Input Returns
                    </Link>
                  </MenubarItem>
                  <MenubarSeparator />

                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/complains/data-complains">
                      <BookOpenCheck className="h-4 w-4" />
                      Data Complains
                    </Link>
                  </MenubarItem>

                  <MenubarSeparator />
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/complains/handout-complains">
                      <BookOpenCheck className="h-4 w-4" />
                      Handout Complains
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/complains/handout-returns">
                      <BookCheck className="h-4 w-4" />
                      Handout Returns
                    </Link>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )}

            {/* Reports menu - visible to superadmin, coordinator, admin, finance */}
            {hasAnyRole([
              "superadmin",
              "coordinator",
              "admin",
              "retur",
              "finance",
            ]) && (
              <MenubarMenu>
                <MenubarTrigger className="cursor-pointer">
                  Reports
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/reports/boxes-count-reports">
                      <FileCheck className="h-4 w-4" />
                      Boxes Count Reports
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/reports/pick-order-reports">
                      <FileCheck className="h-4 w-4" />
                      Pick Order Reports
                    </Link>
                  </MenubarItem>
                  <MenubarItem asChild className="cursor-pointer">
                    <Link href="/reports/user-charge-fee-reports">
                      <FileCheck className="h-4 w-4" />
                      User Charge Fee Reports
                    </Link>
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            )}
          </Menubar>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        <div className="flex items-center text-right">
          <ThemeToggleButton
            theme={currentTheme}
            onClick={handleThemeToggle}
            variant="circle-blur"
            start="top-right"
            className="cursor-pointer"
          />

          {/* <ModeToggle /> */}
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-6"
        />
        <div className="flex items-center justify-end text-right text-sm">
          <User className="mr-2 size-4" />
          <span className="truncate font-semibold text-left mr-2">
            Welcome, {user?.full_name || user?.username}
          </span>
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-6"
          />
          <span className="truncate text-xs text-left">
            {user?.roles && user.roles.length > 0 && (
              <div className="flex gap-1">
                {user.roles.map((role, index) => (
                  <div
                    key={role.id || index}
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${getRoleBadgeStyle(
                      role.name
                    )}`}
                  >
                    {role.name}
                  </div>
                ))}
              </div>
            )}
          </span>
        </div>
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-6"
        />
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}
