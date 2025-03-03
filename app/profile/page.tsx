"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added import for Link component
import { useAuth } from "@/contexts/auth-context";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Home, ArrowLeft } from "lucide-react"; // Added icons

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
  "Japanese", "Korean", "Chinese", "Arabic", "Hindi", "Dutch", "Swedish", "Greek",
];

const interestOptions = [
  "Music", "Movies", "Books", "Travel", "Food", "Sports", "Technology",
  "Art", "Photography", "Gaming", "Fitness", "Fashion", "Nature",
  "Politics", "Science", "History", "Business", "Education",
];

export default function ProfilePage() {
  const { user, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // User profile data
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to sign-in
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Initialize form with user data
    setName(user.displayName || "");
    setPhotoURL(user.photoURL || "/placeholder-user.jpg");

    // In a real app, you would fetch additional user data from Firestore
    // and populate the other fields
    if (user.nativeLanguages) setNativeLanguages(user.nativeLanguages);
    if (user.learningLanguages) setLearningLanguages(user.learningLanguages);
    if (user.bio) setBio(user.bio);
    if (user.age) setAge(user.age.toString());
    if (user.interests) setInterests(user.interests);
  }, [user, router]);

  // Handle profile image upload
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real implementation, this would upload to Firebase Storage
    // and update the user's photoURL
    if (e.target.files && e.target.files[0]) {
      toast({
        title: "Profile image upload",
        description: "Image upload functionality will be implemented with Firebase Storage",
      });
      // Simulate successful upload by showing a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoURL(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Update general profile information
  const handleGeneralUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile({
        name,
        bio,
        age: age ? parseInt(age) : null,
      });

      toast({
        title: "Profile updated",
        description: "Your general information has been updated successfully.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update language preferences
  const handleLanguageUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile({
        nativeLanguages,
        learningLanguages,
      });

      toast({
        title: "Languages updated",
        description: "Your language preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Language update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your language preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update interests
  const handleInterestsUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile({
        interests,
      });

      toast({
        title: "Interests updated",
        description: "Your interests have been updated successfully.",
      });
    } catch (error) {
      console.error("Interests update error:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your interests.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // This would be implemented with Firebase Auth
    toast({
      title: "Account deletion",
      description: "This feature is not implemented yet.",
      variant: "destructive",
    });
  };

  // Handle adding a native language
  const handleAddNativeLanguage = (language: string) => {
    if (!nativeLanguages.includes(language)) {
      setNativeLanguages([...nativeLanguages, language]);
    }
  };

  // Handle removing a native language
  const handleRemoveNativeLanguage = (language: string) => {
    setNativeLanguages(nativeLanguages.filter(lang => lang !== language));
  };

  // Handle adding a learning language
  const handleAddLearningLanguage = (language: string) => {
    if (!learningLanguages.includes(language)) {
      setLearningLanguages([...learningLanguages, language]);
    }
  };

  // Handle removing a learning language
  const handleRemoveLearningLanguage = (language: string) => {
    setLearningLanguages(learningLanguages.filter(lang => lang !== language));
  };

  // Handle adding an interest
  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  // Handle removing an interest
  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(int => int !== interest));
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute min-h-full min-w-full object-cover opacity-20"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-night-sky-with-stars-at-a-calm-lake-time-lapse-53-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm"></div>
      </div>

      <AppShell>
        <div className="relative z-10 flex justify-center items-center min-h-[calc(100vh-4rem)] p-4">
          <div className="w-full max-w-4xl">
            <div className="w-full mb-6 flex justify-between items-center"> {/* Added navigation buttons */}
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to Home</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>Update your profile information and photo.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 flex flex-col items-center justify-start space-y-4">
                        <div className="relative h-48 w-48 rounded-full overflow-hidden border-4 border-primary/20">
                          <img
                            src={photoURL || "/placeholder-user.jpg"}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Label
                              htmlFor="profile-image"
                              className="cursor-pointer text-white font-medium text-center p-2"
                            >
                              Change Photo
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="profile-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageUpload}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => document.getElementById('profile-image')?.click()}
                        >
                          Upload New Photo
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Recommended: Square image, at least 400x400px
                        </p>
                      </div>

                      <div className="md:w-2/3 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Display Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your display name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="age">Age</Label>
                          <Input
                            id="age"
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Your age"
                            min="13"
                            max="120"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">About Me</Label>
                          <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell others about yourself"
                            rows={5}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleGeneralUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Languages Tab */}
              <TabsContent value="languages">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Language Preferences</CardTitle>
                    <CardDescription>Update your native and learning languages.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Native Languages</Label>
                      <Select onValueChange={handleAddNativeLanguage}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add a native language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages
                            .filter(lang => !nativeLanguages.includes(lang))
                            .map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {nativeLanguages.map((language) => (
                          <Badge key={language} variant="secondary" className="px-3 py-1.5 text-sm">
                            {language}
                            <button
                              onClick={() => handleRemoveNativeLanguage(language)}
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Learning Languages</Label>
                      <Select onValueChange={handleAddLearningLanguage}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add a language you're learning" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages
                            .filter(lang => !learningLanguages.includes(lang) && !nativeLanguages.includes(lang))
                            .map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {learningLanguages.map((language) => (
                          <Badge key={language} variant="secondary" className="px-3 py-1.5 text-sm">
                            {language}
                            <button
                              onClick={() => handleRemoveLearningLanguage(language)}
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleLanguageUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Languages"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Interests Tab */}
              <TabsContent value="interests">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Your Interests</CardTitle>
                    <CardDescription>Select topics you're interested in.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Select Your Interests</Label>
                      <Select onValueChange={handleAddInterest}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Add an interest" />
                        </SelectTrigger>
                        <SelectContent>
                          {interestOptions
                            .filter(interest => !interests.includes(interest))
                            .map((interest) => (
                              <SelectItem key={interest} value={interest}>
                                {interest}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {interests.map((interest) => (
                          <Badge key={interest} className="px-3 py-1.5 text-sm">
                            {interest}
                            <button
                              onClick={() => handleRemoveInterest(interest)}
                              className="ml-2 text-muted-foreground hover:text-foreground"
                            >
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={handleInterestsUpdate} disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Interests"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences and security.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Email Address</h3>
                      <p className="text-muted-foreground">{user?.email || "No email address"}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Account Security</h3>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button variant="outline">Change Password</Button>
                        <Button variant="outline">Enable Two-Factor Authentication</Button>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                        <Button variant="outline" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AppShell>
    </div>
  );
}