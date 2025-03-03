
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { LanguageProgress } from "@/components/profile/language-progress";

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", "Russian",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Bengali", "Dutch",
  "Greek", "Hebrew", "Turkish", "Swedish", "Polish", "Vietnamese", "Thai"
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
    
    // Fetch additional user data from Firestore (simplified for brevity)
    const fetchUserData = async () => {
      try {
        // In this example, we're using userData stored in auth context
        // In a real implementation, you'd fetch from Firestore
        if (user) {
          // Simulate fetching user data 
          // This should be replaced with actual Firestore fetch
          setTimeout(() => {
            const mockUserData = {
              bio: user.bio || "",
              age: user.age || "",
              nativeLanguages: user.nativeLanguages || [],
              learningLanguages: user.learningLanguages || [],
              interests: user.interests || [],
            };
            setUserData(mockUserData);
            setBio(mockUserData.bio || "");
            setAge(mockUserData.age ? String(mockUserData.age) : "");
            setNativeLanguages(mockUserData.nativeLanguages || []);
            setLearningLanguages(mockUserData.learningLanguages || []);
            setInterests(mockUserData.interests || []);
          }, 500);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading profile",
          description: "Could not load your profile data.",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
  }, [user, router, toast]);

  // Handle adding/removing native languages (max 3)
  const handleAddNativeLanguage = (language: string) => {
    if (!nativeLanguages.includes(language) && nativeLanguages.length < 3) {
      setNativeLanguages([...nativeLanguages, language]);
    } else if (nativeLanguages.length >= 3) {
      toast({
        title: "Maximum languages reached",
        description: "You can select up to 3 native languages.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveNativeLanguage = (language: string) => {
    setNativeLanguages(nativeLanguages.filter((lang) => lang !== language));
  };

  // Handle adding/removing learning languages (max 5)
  const handleAddLearningLanguage = (language: string) => {
    if (!learningLanguages.includes(language) && learningLanguages.length < 5) {
      setLearningLanguages([...learningLanguages, language]);
    } else if (learningLanguages.length >= 5) {
      toast({
        title: "Maximum languages reached",
        description: "You can select up to 5 learning languages.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveLearningLanguage = (language: string) => {
    setLearningLanguages(learningLanguages.filter((lang) => lang !== language));
  };

  // Handle interests
  const handleToggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h1 className="mb-4 text-xl font-semibold">Loading profile...</h1>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <div>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="language">Languages</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>
                    Update your personal information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div>
                    <h3 className="font-medium mb-2">Profile Picture</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-full">
                        <img
                          src={photoURL}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profile-picture" className="cursor-pointer">
                          <div className="flex items-center mb-2">
                            <Button size="sm" type="button">
                              Upload New Image
                            </Button>
                          </div>
                        </Label>
                        <Input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfileImageUpload}
                        />
                        <p className="text-xs text-muted-foreground">
                          Recommended: Square image, at least 400x400px
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Display Name */}
                  <div>
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your display name"
                      className="mt-1"
                    />
                  </div>
                  
                  {/* Age */}
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Your age (optional)"
                      className="mt-1"
                      min="13"
                      max="120"
                    />
                  </div>
                  
                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell others about yourself..."
                      className="mt-1 min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {bio.length}/500 characters
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleGeneralUpdate} 
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Language Tab */}
            <TabsContent value="language">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                  <CardDescription>
                    Update your language preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Native Languages */}
                  <div className="space-y-2">
                    <Label>Native Languages (up to 3)</Label>
                    <Select onValueChange={handleAddNativeLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a native language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages
                          .filter(language => !nativeLanguages.includes(language))
                          .map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {nativeLanguages.map((language) => (
                        <Badge key={language} variant="secondary" className="px-3 py-1">
                          {language}
                          <button
                            onClick={() => handleRemoveNativeLanguage(language)}
                            className="ml-2 text-xs"
                          >
                            ✕
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Learning Languages */}
                  <div className="space-y-2">
                    <Label>Languages You're Learning (up to 5)</Label>
                    <Select onValueChange={handleAddLearningLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language to learn" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages
                          .filter(language => !learningLanguages.includes(language) && !nativeLanguages.includes(language))
                          .map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {learningLanguages.map((language) => (
                        <Badge key={language} variant="default" className="px-3 py-1">
                          {language}
                          <button
                            onClick={() => handleRemoveLearningLanguage(language)}
                            className="ml-2 text-xs"
                          >
                            ✕
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Language progress component */}
                  <div className="mt-8">
                    <h3 className="font-medium mb-4">Your Progress</h3>
                    <LanguageProgress />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleLanguageUpdate} 
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? "Saving..." : "Save Languages"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Interests Tab */}
            <TabsContent value="interests">
              <Card>
                <CardHeader>
                  <CardTitle>Your Interests</CardTitle>
                  <CardDescription>
                    Select topics you're interested in to find like-minded conversation partners.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <Button
                        key={interest}
                        variant={interests.includes(interest) ? "default" : "outline"}
                        onClick={() => handleToggleInterest(interest)}
                        className="m-1"
                      >
                        {interest}
                      </Button>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleInterestsUpdate} 
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? "Saving..." : "Save Interests"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Account Tab */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Email</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Account Actions</h3>
                    <div className="space-y-4">
                      <Button 
                        variant="outline" 
                        onClick={handleSignOut}
                        className="w-full sm:w-auto"
                      >
                        Sign Out
                      </Button>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-destructive">Danger Zone</h4>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          className="w-full sm:w-auto"
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
