"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { z } from "zod"
import {
  UserCircle,
  Wallet,
  Loader2,
  UploadCloud,
  Settings2,
  Github,
  Twitter,
  Linkedin,
  Globe,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { updateUserProfileSchema } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

type ProfileFormValues = z.infer<typeof updateUserProfileSchema>

interface UserData {
  id: string
  email: string
  username: string
  role: string
  walletAddress?: string | null
  fullName?: string | null
  bio?: string | null
  avatarUrl?: string | null
  country?: string | null
  githubUrl?: string | null
  twitterUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  totalEarnings: number
  totalBounties: number
  reputation: number
}

export function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editingWallet, setEditingWallet] = useState(false)
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [updatingWallet, setUpdatingWallet] = useState(false)
  const userId = session?.user?.id

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      avatarUrl: "",
      country: "",
      githubUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
    },
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const response = await fetch(`/api/users/${userId}`, {
          credentials: "include",
        })
        if (!response.ok) {
          throw new Error("Unable to load profile")
        }
        const payload = await response.json()
        const user = payload?.user
        
        if (user) {
          setUserData(user)
          
          // Reset profile form with user data
          profileForm.reset({
            fullName: user.fullName || "",
            bio: user.bio || "",
            avatarUrl: user.avatarUrl || "",
            country: user.country || "",
            githubUrl: user.githubUrl || "",
            twitterUrl: user.twitterUrl || "",
            linkedinUrl: user.linkedinUrl || "",
            portfolioUrl: user.portfolioUrl || "",
          })
        }
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "Unexpected error loading profile")
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [userId])

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true)
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const payload = await response.json()
      profileForm.setValue("avatarUrl", payload.url ?? undefined, { shouldValidate: true })
      toast.success("Avatar updated")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to upload avatar")
    } finally {
      setAvatarUploading(false)
    }
  }

  const submitProfile = async (values: ProfileFormValues) => {
    if (!userId) {
      toast.error("You need to be signed in")
      return
    }
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error ?? "Failed to update profile")
      }
      const payload = await response.json()
      setUserData(payload.user)
      toast.success("Profile saved successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to update profile")
    }
  }

  const handleUpdateWallet = async () => {
    if (!userId) {
      toast.error("You need to be signed in")
      return
    }

    if (!newWalletAddress.trim()) {
      toast.error("Please enter a wallet address")
      return
    }

    try {
      setUpdatingWallet(true)
      const response = await fetch(`/api/users/${userId}/wallet`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          walletAddress: newWalletAddress.trim(),
        }),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        throw new Error(errorPayload?.error ?? "Failed to update wallet")
      }

      const payload = await response.json()
      setUserData(payload.user)
      setEditingWallet(false)
      setNewWalletAddress("")
      toast.success("Wallet address updated successfully")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Unable to update wallet")
    } finally {
      setUpdatingWallet(false)
    }
  }

  if (status === "loading") {
    return null
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container-custom max-w-xl">
          <Card className="card-glass">
            <CardContent className="p-10 space-y-4 text-center">
              <UserCircle className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Sign in to manage your settings.</p>
              <Button asChild>
                <Link href="/auth/login">Go to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className=" border-b border-border bg-card/40 bg-neutral-100 dark:bg-card/40 backdrop-blur-sm">
        <div className="container-custom py-12 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-semibold flex items-center gap-3">
                <Settings2 className="w-10 h-10 text-yellow-400" /> Account settings
              </h1>
              <p className="text-muted-foreground text-lg">Update your profile, socials, and wallet preferences.</p>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 border-yellow-400/40 text-yellow-200">
              Signed in as {session?.user?.email}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container-custom py-10">
        {error ? (
          <Card className="card-glass border border-red-500/40 max-w-2xl mx-auto mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : null}

        {/* User Stats Card */}
        {userData && (
          <Card className="card-glass mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{userData.totalEarnings} SOL</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.totalBounties}</p>
                  <p className="text-sm text-muted-foreground">Bounties Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{userData.reputation.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Reputation Score</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-base">
                    {userData.role.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">Account Role</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="card-glass">
          <CardHeader>
            <CardTitle>Profile & Account Information</CardTitle>
            <CardDescription>Update your profile details, socials, and wallet address for bounty payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-24 rounded-lg bg-card animate-pulse" />
                <div className="h-24 rounded-lg bg-card animate-pulse" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(submitProfile)} className="space-y-8">
                  {/* Avatar Section */}
                  <div className="pb-6 border-b border-border">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserCircle className="w-5 h-5" /> Profile Picture
                    </h3>
                    <div className="flex items-center gap-6">
                      {profileForm.watch("avatarUrl") ? (
                        <Image
                          width={96}
                          height={96}
                          src={profileForm.watch("avatarUrl") || ""}
                          alt="Avatar"
                          className="h-24 w-24 rounded-full border-2 border-border object-cover"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                          <UserCircle className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition">
                          {avatarUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UploadCloud className="w-4 h-4" />
                          )}
                          <span className="text-sm">{avatarUploading ? "Uploading..." : "Upload new avatar"}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            disabled={avatarUploading}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                void handleAvatarUpload(file)
                              }
                            }}
                          />
                        </label>
                        {profileForm.watch("avatarUrl") && !avatarUploading && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => profileForm.setValue("avatarUrl", "", { shouldValidate: true })}
                          >
                            Remove avatar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Basic Info Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Settings2 className="w-5 h-5" /> Basic Information
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jane Doe"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Remote"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Share your expertise and focus areas"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Wallet Section */}
                  <div className="pb-6 border-y border-border py-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-yellow-400" /> Wallet Address
                    </h3>
                    {!editingWallet ? (
                      <div>
                        {userData?.walletAddress ? (
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-yellow-400/10 border border-yellow-400/40">
                              <p className="text-sm font-medium mb-2 text-yellow-400">Connected Wallet</p>
                              <p className="font-mono text-sm break-all">{userData.walletAddress}</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingWallet(true)
                                setNewWalletAddress(userData.walletAddress || "")
                              }}
                            >
                              Change Wallet Address
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-muted border border-dashed">
                              <p className="text-sm text-muted-foreground">No wallet connected yet.</p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingWallet(true)}
                            >
                              Add Wallet Address
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Solana Wallet Address
                          </label>
                          <Input
                            placeholder="Enter your Solana wallet address"
                            value={newWalletAddress}
                            onChange={(e) => setNewWalletAddress(e.target.value)}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Enter the wallet address where you want to receive bounty payouts
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleUpdateWallet}
                            disabled={updatingWallet}
                            size="sm"
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                          >
                            {updatingWallet ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : null}
                            {userData?.walletAddress ? "Update" : "Add"} Wallet
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingWallet(false)
                              setNewWalletAddress("")
                            }}
                            disabled={updatingWallet}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Social Links Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Social Links</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="githubUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Github className="w-4 h-4" /> GitHub
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://github.com/username"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Showcase your repositories
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="twitterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Twitter className="w-4 h-4" /> Twitter / X
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://twitter.com/username"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Connect with the community
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="linkedinUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Linkedin className="w-4 h-4" /> LinkedIn
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://linkedin.com/in/username"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Optional professional profile
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="portfolioUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Globe className="w-4 h-4" /> Portfolio
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://your-portfolio.com"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Personal site or case studies
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={profileForm.formState.isSubmitting}
                      size="lg"
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                    >
                      {profileForm.formState.isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
