"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

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

export default function Onboarding() {
  const { user, updateUserProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [nativeLanguages, setNativeLanguages] = useState<string[]>([]);
  const [learningLanguages, setLearningLanguages] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle user not being authenticated
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-full max-w-md p-6">
          <h1 className="mb-4 text-xl font-semibold">User not authenticated</h1>
          <p className="mb-4">Please sign in to continue</p>
          <Button onClick={() => router.push("/sign-in")}>
            Go to Sign In
          </Button>
        </Card>
      </div>
    );
  }

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

  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest]);
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleNext = () => {
    if (step === 1 && nativeLanguages.length === 0) {
      toast({
        title: "Please select at least one native language",
        description: "You need to select at least one native language to continue.",
        variant: "destructive",
      });
      return;
    }

    if (step === 1 && learningLanguages.length === 0) {
      toast({
        title: "Please select a learning language",
        description: "You need to select at least one language you're learning.",
        variant: "destructive",
      });
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      await updateUserProfile({
        nativeLanguages,
        learningLanguages,
        proficiency,
        interests,
        bio,
        age: age ? parseInt(age) : null,
        onboardingCompleted: true,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully set up.",
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-lg shadow-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Set Up Your Profile</CardTitle>
          <CardDescription className="text-center">
            Step {step} of 3: {step === 1 ? "Language Preferences" : step === 2 ? "Your Interests" : "About You"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Native Languages (up to 3)</Label>
                <Select onValueChange={handleAddNativeLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your native languages" />
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
              <div className="space-y-2">
                <Label>Languages You're Learning (up to 5)</Label>
                <Select onValueChange={handleAddLearningLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select languages you're learning" />
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
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency Level</Label>
                <Select value={proficiency} onValueChange={setProficiency}>
                  <SelectTrigger id="proficiency">
                    <SelectValue placeholder="Select your proficiency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="fluent">Fluent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Your Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <Button
                      key={interest}
                      variant={interests.includes(interest) ? "default" : "outline"}
                      onClick={() => {
                        if (interests.includes(interest)) {
                          handleRemoveInterest(interest);
                        } else {
                          handleAddInterest(interest);
                        }
                      }}
                      className="m-1"
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="13"
                  max="120"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}