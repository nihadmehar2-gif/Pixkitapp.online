"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { PixKitLogo } from "./logo";
import { SearchDialog, SearchTrigger } from "./search-dialog";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/tools/categories";
import { CATEGORY_COUNTS } from "@/lib/tools/search-index";
import { Menu, Moon, Sun, Search } from "lucide-react";

const NAV = [
  { href: "/tools", label: "All Tools" },
  { href: "/categories/compress", label: "Compress" },
  { href: "/categories/convert", label: "Convert" },
  { href: "/categories/passport-photos", label: "Passport Photos" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="PixKitApp home">
          <PixKitLogo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-[44px] items-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                pathname === item.href ? "text-foreground font-semibold" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <SearchTrigger onClick={() => setSearchOpen(true)} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 sm:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Search tools"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] overflow-y-auto">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <div className="mt-2 flex flex-col gap-1">
                <Link href="/tools" onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-base font-semibold hover:bg-accent">
                  All Tools
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs">{CATEGORY_COUNTS[cat.id] ?? 0}</span>
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                {["/about", "/contact", "/privacy", "/terms"].map((href) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm capitalize hover:bg-accent">
                    {href.replace("/", "")}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
