import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { text, imageData } = await request.json()

    // Get LinkedIn auth
    const auth = await prisma.linkedInAuth.findUnique({
      where: { userId: 'default' },
    })

    if (!auth || new Date() > auth.expiresAt) {
      return NextResponse.json(
        { error: 'Not authenticated with LinkedIn' },
        { status: 401 }
      )
    }

    // Get user profile ID
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    const profile = await profileResponse.json()
    const personUrn = `urn:li:person:${profile.sub}`

    let shareContent: any = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: imageData ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    // If image, upload it first
    if (imageData) {
      const base64Data = imageData.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      // Register upload
      const registerResponse = await fetch(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: personUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent',
                },
              ],
            },
          }),
        }
      )

      const registerData = await registerResponse.json()
      const uploadUrl = registerData.value.uploadMechanism[
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
      ].uploadUrl
      const asset = registerData.value.asset

      // Upload image
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: buffer,
      })

      // Add image to share content
      shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          media: asset,
        },
      ]
    }

    // Post to LinkedIn
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(shareContent),
    })

    if (!postResponse.ok) {
      const error = await postResponse.text()
      console.error('LinkedIn post error:', error)
      throw new Error('Failed to post')
    }

    const result = await postResponse.json()
    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Post error:', error)
    return NextResponse.json(
      { error: 'Failed to post to LinkedIn' },
      { status: 500 }
    )
  }
}
