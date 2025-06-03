"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User } from "lucide-react"
import { useSupabase } from "@/components/supabase-provider"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const pathname = usePathname()
  const { supabase, session } = useSupabase()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (session?.user) {
      // Fetch cart count
      const fetchCartCount = async () => {
        const { data, error } = await supabase
          .from("cart_items")
          .select("*", { count: "exact" })
          .eq("user_id", session.user.id)

        if (!error && data) {
          setCartCount(data.length)
        }
      }

      fetchCartCount()

      // Subscribe to changes
      const channel = supabase
        .channel("cart_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            fetchCartCount()
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, session])

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">Mood Store</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/"
            className={`text-sm font-medium ${pathname === "/" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`text-sm font-medium ${pathname === "/products" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
          >
            All Products
          </Link>
          <Link
            href="/mood-quiz"
            className={`text-sm font-medium ${pathname === "/mood-quiz" ? "text-primary" : "text-muted-foreground"} transition-colors hover:text-primary`}
          >
            Mood Quiz
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <>
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/account">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = "/"
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

