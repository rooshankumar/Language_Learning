
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    interests: [],
    experience: "",
    goals: []
  });

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

  const handleComplete = async () => {
    try {
      // Safe check for user and db
      if (!user || !db) {
        console.error("User or database not available");
        return;
      }

      // For development mock environment
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.log("Mock onboarding complete:", preferences);
        router.push("/");
        return;
      }

      // For production environment
      const userDocRef = doc(db, "users", user.uid);
      
      // Update user preferences in Firestore
      await setDoc(userDocRef, {
        preferences,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      router.push("/");
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  // Steps for onboarding process
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Welcome! Let's get to know you better</h2>
            <p>Select your interests:</p>
            {/* Interest selection UI here */}
            <div className="flex flex-wrap gap-2">
              {["Technology", "Science", "Art", "Music", "Sports", "Travel"].map((interest) => (
                <Button
                  key={interest}
                  variant={preferences.interests.includes(interest) ? "default" : "outline"}
                  onClick={() => {
                    setPreferences(prev => ({
                      ...prev,
                      interests: prev.interests.includes(interest)
                        ? prev.interests.filter(i => i !== interest)
                        : [...prev.interests, interest]
                    }));
                  }}
                  className="m-1"
                >
                  {interest}
                </Button>
              ))}
            </div>
            <Button onClick={() => setStep(2)} className="mt-4">Next</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-medium">What's your experience level?</h2>
            <div className="space-y-2">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <Button
                  key={level}
                  variant={preferences.experience === level ? "default" : "outline"}
                  onClick={() => setPreferences(prev => ({ ...prev, experience: level }))}
                  className="w-full justify-start"
                >
                  {level}
                </Button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-medium">What are your goals?</h2>
            <div className="flex flex-wrap gap-2">
              {["Learn new skills", "Meet people", "Build projects", "Find mentorship"].map((goal) => (
                <Button
                  key={goal}
                  variant={preferences.goals.includes(goal) ? "default" : "outline"}
                  onClick={() => {
                    setPreferences(prev => ({
                      ...prev,
                      goals: prev.goals.includes(goal)
                        ? prev.goals.filter(g => g !== goal)
                        : [...prev.goals, goal]
                    }));
                  }}
                  className="m-1"
                >
                  {goal}
                </Button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleComplete}>Complete</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Let's set up your profile</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
        </div>
        {renderStep()}
      </Card>
    </div>
  );
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
]

const interestOptions = [
  "Music",
  "Movies",
  "Books",
  "Travel",
  "Food",
  "Sports",
  "Technology",
  "Art",
  "Photography",
  "Gaming",
  "Fitness",
  "Fashion",
  "Nature",
  "Politics",
  "Science",
  "History",
  "Business",
  "Education",
]

export default function Onboarding() {
  const { user, updateUserProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState(1)
  const [nativeLanguage, setNativeLanguage] = useState("")
  const [learningLanguage, setLearningLanguage] = useState("")
  const [proficiency, setProficiency] = useState("beginner")
  const [interests, setInterests] = useState<string[]>([])
  const [bio, setBio] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAddInterest = (interest: string) => {
    if (!interests.includes(interest)) {
      setInterests([...interests, interest])
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest))
  }

  const handleNext = () => {
    if (step === 1 && (!nativeLanguage || !learningLanguage)) {
      toast({
        title: "Please select languages",
        description: "You need to select both your native and learning languages.",
        variant: "destructive",
      })
      return
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!user) return

    setIsLoading(true)

    try {
      await updateUserProfile({
        nativeLanguage,
        learningLanguage,
        interests,
        bio,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully set up.",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 gradient-bg">
      <Card className="w-full max-w-lg glass-effect">
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
                <Label htmlFor="native-language">Native Language</Label>
                <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                  <SelectTrigger id="native-language">
                    <SelectValue placeholder="Select your native language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="learning-language">Language You're Learning</Label>
                <Select value={learningLanguage} onValueChange={setLearningLanguage}>
                  <SelectTrigger id="learning-language">
                    <SelectValue placeholder="Select language you're learning" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((lang) => lang !== nativeLanguage)
                      .map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proficiency Level</Label>
                <RadioGroup value={proficiency} onValueChange={setProficiency}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">Beginner</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">Intermediate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">Advanced</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select Your Interests</Label>
                <p className="text-sm text-muted-foreground">
                  Choose topics you'd like to discuss with language partners
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {interestOptions.map((interest) => (
                    <Button
                      key={interest}
                      type="button"
                      variant={interests.includes(interest) ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleAddInterest(interest)}
                    >
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
              {interests.length > 0 && (
                <div>
                  <Label>Selected Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="pl-2 pr-1 py-1">
                        {interest}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleRemoveInterest(interest)}
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove {interest}</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio">About You</Label>
                <p className="text-sm text-muted-foreground">
                  Write a short bio to introduce yourself to potential language partners
                </p>
                <Textarea
                  id="bio"
                  placeholder="Hi! I'm learning Spanish to travel through South America next year..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          {step < 3 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

