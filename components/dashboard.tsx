
import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageCircle, Calendar, BookOpen, Trophy, Clock, Users } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  
  // Generate current user data
  const userName = user?.displayName || "Language Learner";
  const currentDate = new Date();
  
  // Generate realistic data
  const practiceStreak = Math.floor(Math.random() * 15) + 1;
  const vocabularyWords = Math.floor(Math.random() * 200) + 50;
  const weeklyIncrement = Math.floor(Math.random() * 30) + 5;
  const activePartners = Math.floor(Math.random() * 5) + 1;
  
  // Random partner names for more realism
  const partnerNames = [
    "Emma Thompson", "Miguel Hernandez", "Sophia Chen", 
    "Hiroshi Tanaka", "Fatima Al-Farsi", "Pierre Dubois", 
    "Ana Silva", "Raj Patel", "Isabella Rodriguez"
  ];
  
  // Last conversation times
  const conversationTimes = [
    "Just now",
    "10 minutes ago",
    "2 hours ago",
    "Yesterday",
    "2 days ago"
  ];
  
  // Upcoming lessons
  const upcomingLessons = [
    {
      title: "Conversation Practice",
      teacher: partnerNames[Math.floor(Math.random() * partnerNames.length)],
      time: `Tomorrow, ${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    },
    {
      title: "Vocabulary Builder",
      teacher: partnerNames[Math.floor(Math.random() * partnerNames.length)],
      time: `${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][Math.floor(Math.random() * 5)]}, ${Math.floor(Math.random() * 12) + 1}:${Math.random() > 0.5 ? '30' : '00'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    }
  ];
  
  // Slice a random subset of partner names for recent conversations
  const shuffledPartners = [...partnerNames].sort(() => 0.5 - Math.random());
  const recentConversations = shuffledPartners.slice(0, 3).map((name, index) => ({
    name,
    time: conversationTimes[index],
    unread: Math.random() > 0.7
  }));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Language Exchange</h1>
        <p className="text-center mb-6">Please sign in to access your dashboard.</p>
        <Link href="/sign-in">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Welcome, {userName}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Language Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Practice Streak</span>
                  <span className="text-sm font-medium">{practiceStreak} days</span>
                </div>
                <Progress value={(practiceStreak / 30) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Keep it up!</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Vocabulary</span>
                  <span className="text-sm font-medium">{vocabularyWords} words</span>
                </div>
                <Progress value={(vocabularyWords / 500) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">+{weeklyIncrement} from last week</p>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Active Partners</span>
                  <span className="text-sm font-medium">{activePartners}</span>
                </div>
                <Progress value={(activePartners / 10) * 100} className="h-2" />
                <Link href="/community">
                  <Button variant="link" className="p-0 text-xs h-auto">Connect with more partners</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Conversations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Recent Conversations
            </CardTitle>
            <CardDescription>Your latest language exchange sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConversations.map((conversation, index) => (
                <Link href="/chat" key={index} className="block">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        {conversation.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{conversation.name}</span>
                          {conversation.unread && <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/chat" className="w-full">
              <Button className="w-full" variant="outline">View All Conversations</Button>
            </Link>
          </CardFooter>
        </Card>
        
        {/* Upcoming Lessons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Upcoming Lessons
            </CardTitle>
            <CardDescription>Scheduled language sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingLessons.map((lesson, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{lesson.title}</span>
                    <Badge variant="outline" className="ml-2">
                      <Clock className="mr-1 h-3 w-3" />
                      {lesson.time.includes("Tomorrow") ? "Tomorrow" : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    <span>with {lesson.teacher}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{lesson.time}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">Schedule New Lesson</Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/chat">
          <Button variant="outline" className="w-full justify-start">
            <MessageCircle className="mr-2 h-4 w-4" />
            Start Conversation
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="outline" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
        <Link href="/community">
          <Button variant="outline" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Find Partners
          </Button>
        </Link>
        <Link href="#">
          <Button variant="outline" className="w-full justify-start">
            <BookOpen className="mr-2 h-4 w-4" />
            Learning Resources
          </Button>
        </Link>
      </div>
    </div>
  );
}
