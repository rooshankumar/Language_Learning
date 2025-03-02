"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface UserFiltersProps {
  filters: {
    language: string
    interests: string[]
  }
  setFilters: React.Dispatch<
    React.SetStateAction<{
      language: string
      interests: string[]
    }>
  >
}

export function UserFilters({ filters, setFilters }: UserFiltersProps) {
  const [selectedInterest, setSelectedInterest] = useState("")

  const handleAddInterest = () => {
    if (selectedInterest && !filters.interests.includes(selectedInterest)) {
      setFilters((prev) => ({
        ...prev,
        interests: [...prev.interests, selectedInterest],
      }))
      setSelectedInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      language: "",
      interests: [],
    })
    setSelectedInterest("")
  }

  return (
    <div className="w-full md:w-72 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={filters.language}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, language: value }))}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interests">Interests</Label>
            <div className="flex gap-2">
              <Select value={selectedInterest} onValueChange={setSelectedInterest}>
                <SelectTrigger id="interests" className="flex-1">
                  <SelectValue placeholder="Select interest" />
                </SelectTrigger>
                <SelectContent>
                  {interestOptions
                    .filter((interest) => !filters.interests.includes(interest))
                    .map((interest) => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" onClick={handleAddInterest} disabled={!selectedInterest}>
                Add
              </Button>
            </div>
          </div>

          {filters.interests.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Interests</Label>
              <div className="flex flex-wrap gap-1">
                {filters.interests.map((interest) => (
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

          {(filters.language || filters.interests.length > 0) && (
            <Button variant="outline" className="w-full mt-4" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FiltersState {
  language: string
  interests: string[]
}

interface UserFiltersProps {
  onFilterChange: (filters: FiltersState) => void
}

// Example interests - in a real app, these might come from your database
const INTERESTS = [
  "Music",
  "Movies",
  "Books",
  "Sports",
  "Travel",
  "Food",
  "Art",
  "Technology",
  "Gaming",
  "Photography"
]

// Example languages - in a real app, these might come from your database
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic"
]

export function UserFilters({ onFilterChange }: UserFiltersProps) {
  const [filters, setFilters] = useState<FiltersState>({
    language: "",
    interests: [],
  })

  // Report filter changes to parent component
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  // Toggle an interest in the filter
  const toggleInterest = (interest: string) => {
    setFilters(prev => {
      if (prev.interests.includes(interest)) {
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest)
        }
      } else {
        return {
          ...prev,
          interests: [...prev.interests, interest]
        }
      }
    })
  }

  // Update language filter
  const handleLanguageChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      language: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      language: "",
      interests: []
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Filters</span>
          {(filters.language || filters.interests.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs"
            >
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Language</h3>
          <Select 
            value={filters.language} 
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any language</SelectItem>
              {LANGUAGES.map(language => (
                <SelectItem key={language} value={language}>{language}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Interests filter */}
        <div>
          <h3 className="text-sm font-medium mb-2">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map(interest => (
              <Badge 
                key={interest}
                variant={filters.interests.includes(interest) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleInterest(interest)}
              >
                {interest}
                {filters.interests.includes(interest) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}