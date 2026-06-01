"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  BriefcaseMedical, 
  FileText, 
  Building, 
  ArrowLeft, 
  Home,
  Settings,
  Shield,
  Bell,
  Globe,
  Lock,
  Smartphone,
  Calendar,
  CreditCard,
  Key,
  LogOut
} from "lucide-react"
import { updateUserProfile, uploadAvatar } from "@/lib/actions/user-actions"
import type { User as UserType } from "@/lib/types/database"
import { signOut } from "@/lib/auth/actions"

const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  professional_registration_number: z.string().optional().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

type ProfileTab = "personal" | "professional" | "account" | "settings" | "security"

interface ProfilePageClientProps {
  initialUser: UserType
}

export default function ProfilePageClient({ initialUser }: ProfilePageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserType>(initialUser)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal")

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      specialization: user.specialization || "",
      professional_registration_number: user.professional_registration_number || "",
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true)
    try {
      const result = await updateUserProfile(data)
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: result.message,
        })
        setUser(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const result = await uploadAvatar(formData)
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Update user avatar in state
        setUser(prev => ({ ...prev, avatar_url: result.data!.avatar_url }))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to upload avatar",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const sidebarItems = [
    { 
      id: "personal" as ProfileTab, 
      label: "Personal Info", 
      icon: User, 
      description: "Basic information" 
    },
    { 
      id: "professional" as ProfileTab, 
      label: "Professional", 
      icon: BriefcaseMedical, 
      description: "Work details",
      showFor: ["doctor", "nurse", "admin"]
    },
    { 
      id: "account" as ProfileTab, 
      label: "Account", 
      icon: Settings, 
      description: "Account settings" 
    },
    { 
      id: "security" as ProfileTab, 
      label: "Security", 
      icon: Shield, 
      description: "Password & security" 
    },
  ]

  const handleGoBack = () => {
    router.back()
  }

  // Filter sidebar items based on user role
  const filteredSidebarItems = sidebarItems.filter(item => {
    if (!item.showFor) return true
    return item.showFor.includes(user.role || "")
  })

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
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and profile settings
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
              {/* User Profile Summary */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    ) : null}
                    <AvatarFallback className="text-xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary capitalize">
                      {user.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 gap-2"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {isUploading ? "Uploading..." : "Change Photo"}
                </Button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>

              <Separator className="my-4" />

              {/* Navigation */}
              <div className="space-y-2">
                {filteredSidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? "bg-primary/10 text-primary border border-primary/20"
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

              {/* Sign Out Button */}
              <div className="mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive hover:border-destructive"
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
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Full Name
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Address
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="john@example.com" 
                                  {...field} 
                                  value={field.value || ""}
                                  disabled
                                  className="bg-muted"
                                />
                              </FormControl>
                              <FormDescription>
                                Contact support to change your email
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+1234567890" 
                                  {...field} 
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.reset()}
                          disabled={isSubmitting}
                        >
                          Reset
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Professional Information Tab */}
          {activeTab === "professional" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BriefcaseMedical className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                  <CardDescription>
                    {user.role === "employer" 
                      ? "Company and business details"
                      : "Medical credentials and specialization"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Professional Information for Medical Staff */}
                      {(user.role === "doctor" || user.role === "nurse") && (
                        <div className="space-y-6">
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="specialization"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <BriefcaseMedical className="h-4 w-4" />
                                    Specialization
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., Cardiology, Pediatrics" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="professional_registration_number"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Registration Number
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g., M12345" 
                                      {...field} 
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}

                      {/* Company Information for Employers */}
                      {user.role === "employer" && (
                        <div className="space-y-6">
                          <div className="grid gap-4">
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Company Name
                              </FormLabel>
                              <Input 
                                value={user.company_name || ""}
                                disabled
                                className="bg-muted"
                              />
                              <FormDescription>
                                Contact your clinic admin to update company information
                              </FormDescription>
                            </FormItem>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-4 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => form.reset()}
                          disabled={isSubmitting}
                        >
                          Reset
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Professional Info"
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Account Information Tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Details about your account and access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Role
                      </label>
                      <div className="px-3 py-2 rounded-md bg-muted">
                        <span className="capitalize">{user.role?.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your role determines what actions you can perform in the system
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Account Status
                      </label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                        <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Account Created
                      </label>
                      <div className="px-3 py-2 rounded-md bg-muted">
                        {formatDate(user.created_at)}
                      </div>
                    </div>

                    {user.last_login && (
                      <div className="grid gap-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Last Login
                        </label>
                        <div className="px-3 py-2 rounded-md bg-muted">
                          {formatDate(user.last_login)}
                        </div>
                      </div>
                    )}

                    {user.updated_at && (
                      <div className="grid gap-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Last Updated
                        </label>
                        <div className="px-3 py-2 rounded-md bg-muted">
                          {formatDate(user.updated_at)}
                        </div>
                      </div>
                    )}

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push("/settings")}
                      >
                        <Settings className="h-4 w-4" />
                        Go to Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Change Password
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure
                      </p>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push("/settings")}
                      >
                        <Lock className="h-4 w-4" />
                        Change Password
                      </Button>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium">2FA Status</p>
                          <p className="text-sm text-muted-foreground">
                            Currently disabled
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push("/settings")}
                        >
                          Enable 2FA
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Session Management
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Manage your active sessions across devices
                      </p>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          toast({
                            title: "Sessions",
                            description: "Session management coming soon",
                          })
                        }}
                      >
                        <Smartphone className="h-4 w-4" />
                        View Active Sessions
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                      <Button onClick={() => router.push("/settings")}>
                        <Settings className="h-4 w-4 mr-2" />
                        Go to Full Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
