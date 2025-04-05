"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { User, Package, Upload } from "lucide-react"
import type { Database } from "@/lib/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type Order = {
  id: string
  created_at: string
  total: number
  status: string
}

export default function Account() {
  const router = useRouter()
  const { supabase, session } = useSupabase()
  const { toast } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) {
        setLoading(false)
        return
      }

      // Get profile
      const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

      if (error) {
        console.error("Error fetching profile:", error)
      } else if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setUsername(data.username || "")
        setAvatarUrl(data.avatar_url || "")
      }

      // Get orders
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (orderError) {
        console.error("Error fetching orders:", orderError)
      } else {
        setOrders(orderData || [])
      }

      setLoading(false)
    }

    fetchProfile()
  }, [supabase, session])

  const updateProfile = async () => {
    if (!session) return

    setUpdating(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    }

    setUpdating(false)
  }

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    const fileExt = file.name.split(".").pop()
    const filePath = `${session?.user.id}/avatar.${fileExt}`

    setUploading(true)

    // Upload file
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })

    if (uploadError) {
      toast({
        title: "Error uploading avatar",
        description: uploadError.message,
        variant: "destructive",
      })
      setUploading(false)
      return
    }

    // Get public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

    setAvatarUrl(data.publicUrl)
    setUploading(false)
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">My Account</h1>
        <p className="mb-6">Please sign in to view your account</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>

      <Tabs defaultValue="profile" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-muted">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl || "/placeholder.svg"}
                        alt="Avatar"
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Upload className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadAvatar}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={session.user.email} disabled />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={updateProfile} disabled={updating}>
                  {updating ? "Updating..." : "Update Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View your recent orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row justify-between gap-2">
                        <div>
                          <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="font-medium">${order.total.toFixed(2)}</span>
                            <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/orders/${order.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No orders yet</h3>
                  <p className="text-muted-foreground mt-1 mb-4">You haven't placed any orders yet</p>
                  <Button onClick={() => router.push("/products")}>Start Shopping</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

