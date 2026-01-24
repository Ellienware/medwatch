"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Loader2,
  Settings,
  Bell,
  Shield,
  Globe,
  Lock,
  Smartphone,
  User,
  ArrowLeft,
  Home,
  Mail,
  Eye,
  Download,
  Trash2,
  LogOut,
} from "lucide-react"
import { updateUserSettings, changePassword, getUserSettings } from "@/lib/actions/user-actions"
import type { User as UserType } from "@/lib/types/database"
import { signOut } from "@/lib/auth/actions"

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

// Settings schema
const settingsSchema = z.object({
  email_notifications: z.boolean().default(true),
  push_notifications: z.boolean().default(true),
  two_factor_enabled: z.boolean().default(false),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
})

type PasswordFormValues = z.infer<typeof passwordSchema>
type SettingsFormValues = z.infer<typeof settingsSchema>

type SettingTab = "general" | "notifications" | "security" | "password" | "preferences" | "danger"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingTab>("general")

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      email_notifications: true,
      push_notifications: true,
      two_factor_enabled: false,
      language: "en",
      timezone: "UTC",
    },
  })

  useEffect(() => {
    fetchUserAndSettings()
  }, [])

  async function fetchUserAndSettings() {
    try {
      // Fetch user data
      const userResponse = await fetch("/api/auth/user")
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
      }

      // Fetch user settings
      const settingsResult = await getUserSettings()
      if (settingsResult.success && settingsResult.data) {
        settingsForm.reset(settingsResult.data)
      }
    } catch (error) {
      console.error("Error fetching user and settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSettingsSubmit(data: SettingsFormValues) {
    setIsSubmittingSettings(true)
    try {
      const result = await updateUserSettings(data)
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: result.message,
        })
        setUser(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingSettings(false)
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    setIsSubmittingPassword(true)
    try {
      const result = await changePassword(data)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        passwordForm.reset()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  const handleGoBack = () => {
    router.back()
  }

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Africa/Johannesburg",
  ]

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
  ]

  const sidebarItems = [
    { id: "general", label: "General", icon: Settings, description: "Account overview" },
    { id: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences" },
    { id: "security", label: "Security", icon: Shield, description: "Account security" },
    { id: "password", label: "Password", icon: Lock, description: "Change password" },
    { id: "preferences", label: "Preferences", icon: Globe, description: "Language & timezone" },
    { id: "danger", label: "Danger Zone", icon: Trash2, description: "Account management", isDanger: true },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleGoBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-1/4">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              <div className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as SettingTab)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                          ? item.isDanger
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div>{item.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* User Info */}
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{user?.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          {/* General Settings */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Overview
                </CardTitle>
                <CardDescription>
                  View and manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input value={user?.full_name || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address</label>
                      <Input value={user?.email || ""} readOnly />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role</label>
                      <Input value={user?.role || "User"} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account Created</label>
                      <Input
                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={settingsForm.control}
                        name="email_notifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="push_notifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Push Notifications</FormLabel>
                              <FormDescription>
                                Receive in-app notifications
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingSettings}>
                        {isSubmittingSettings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Notification Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <FormField
                        control={settingsForm.control}
                        name="two_factor_enabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                              <FormDescription>
                                Add an extra layer of security to your account
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingSettings}>
                        {isSubmittingSettings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Security Settings"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Change Password */}
          {activeTab === "password" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters with uppercase, lowercase, number, and special character
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingPassword}>
                        {isSubmittingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="bg-muted/50 border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Forgot your password?{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => router.push("/auth/forgot-password")}
                  >
                    Reset it here
                  </Button>
                </p>
              </CardFooter>
            </Card>
          )}

          {/* Preferences */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={settingsForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {languages.map((lang) => (
                                  <SelectItem key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={settingsForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timezones.map((tz) => (
                                  <SelectItem key={tz} value={tz}>
                                    {tz}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmittingSettings}>
                        {isSubmittingSettings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {activeTab === "danger" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mobile App */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile App
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Download the Mobile App</h4>
                        <p className="text-sm text-muted-foreground">
                          Access your account from your smartphone
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" asChild>
                        <a href="#" onClick={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Coming Soon",
                            description: "Mobile app will be available soon",
                          })
                        }}>
                          iOS App
                        </a>
                      </Button>
                      <Button variant="outline" className="flex-1" asChild>
                        <a href="#" onClick={(e) => {
                          e.preventDefault()
                          toast({
                            title: "Coming Soon",
                            description: "Mobile app will be available soon",
                          })
                        }}>
                          Android App
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Data Management */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Data Management
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Export Data</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Download a copy of all your personal data stored in our systems.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2 gap-2"
                        onClick={() => {
                          toast({
                            title: "Data Export",
                            description: "Your data export request has been submitted",
                          })
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Request Data Export
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Account Deletion */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Delete Account
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        toast({
                          title: "Account Deletion",
                          description: "Please contact support to delete your account",
                          variant: "destructive",
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}