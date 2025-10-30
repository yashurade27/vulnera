import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/og-image?url=<project-url>
 * Fetches Open Graph image from a given URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Fetch the HTML content
    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VulneraBot/1.0)',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL', imageUrl: null }, { status: 200 })
    }

    const html = await response.text()

    // Extract Open Graph image
    const ogImageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)

    // Try Twitter card image as fallback
    const twitterImageMatch =
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i)

    // Try other common meta tags
    const imageMatch =
      html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']image["']/i)

    let imageUrl = ogImageMatch?.[1] || twitterImageMatch?.[1] || imageMatch?.[1]

    // If image URL is relative, make it absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, validUrl.origin).toString()
    }

    return NextResponse.json({ imageUrl: imageUrl || null })
  } catch (error) {
    console.error('Error fetching OG image:', error)
    // Return null image instead of error to allow fallback
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}

