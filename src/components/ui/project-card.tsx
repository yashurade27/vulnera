'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    website: string | null
  }
  gradientIndex: number
}

// Array of Unsplash gradient images
const GRADIENT_IMAGES = [
  'https://images.unsplash.com/photo-1707570009826-4cf80a925b81?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1710173231617-34915a0cf627?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1618004652321-13a63e576b80?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1508349937151-22b68b72d5b1?w=800&auto=format&fit=crop',
]

export function ProjectCard({ project, gradientIndex }: ProjectCardProps) {
  const [bannerImage, setBannerImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const fallbackImage = GRADIENT_IMAGES[gradientIndex % GRADIENT_IMAGES.length]

  useEffect(() => {
    async function fetchBannerImage() {
      if (!project.website) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/og-image?url=${encodeURIComponent(project.website)}`)
        const data = await response.json()
        
        if (data.imageUrl) {
          setBannerImage(data.imageUrl)
        }
      } catch (error) {
        console.error('Error fetching banner image:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBannerImage()
  }, [project.website])

  const displayImage = bannerImage || fallbackImage

  return (
    <Card className="group overflow-hidden border-border hover:border-yellow-400/50 transition-all duration-300">
      <div className="relative h-32 overflow-hidden bg-muted">
        <img
          src={displayImage}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            // If the fetched image fails to load, use fallback
            const target = e.target as HTMLImageElement
            if (target.src !== fallbackImage) {
              target.src = fallbackImage
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-yellow-300 transition-colors">
            {project.name}
          </h3>
          {project.website && (
            <Link
              href={project.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-yellow-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
        {project.description && <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
      </CardContent>
    </Card>
  )
}
