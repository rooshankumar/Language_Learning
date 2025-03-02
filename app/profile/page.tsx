"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppShell } from "@/components/app-shell"
import { useAuth } from "@/contexts/auth-context"

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <div>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="language">Language Settings</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Update your personal information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Profile Picture</h3>
                    <div className="mt-2 flex items-center gap-4">
                      <img
                        src={user?.photoURL || "/placeholder-user.jpg"}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                      <Button size="sm">Change</Button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium">Display Name</h3>
                    <p className="mt-1 text-muted-foreground">{user?.displayName || "Not set"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Bio</h3>
                    <p className="mt-1 text-muted-foreground">{user?.bio || "No bio added yet"}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="language">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                  <CardDescription>
                    Manage your language preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Native Language</h3>
                    <p className="mt-1 text-muted-foreground">{user?.nativeLanguage || "Not set"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Learning Language</h3>
                    <p className="mt-1 text-muted-foreground">{user?.learningLanguage || "Not set"}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="mt-1 text-muted-foreground">{user?.email || "Not set"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Member Since</h3>
                    <p className="text-muted-foreground">January 1, 2023</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                    Delete Account
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  )
}