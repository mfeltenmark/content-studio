import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeImage(imageBase64: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analysera denna bild för ett LinkedIn/Instagram-inlägg. Ge:
1. Kort beskrivning av bilden
2. 5 relevanta hashtags
3. 3 caption-idéer (en professionell, en casual, en kreativ)

Svara på svenska i JSON-format:
{"description": "...", "hashtags": ["..."], "captions": ["..."]}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch (error) {
    console.error('Error analyzing image:', error)
    return { description: 'Kunde inte analysera bild', hashtags: [], captions: [] }
  }
}

export async function polishText(rawText: string, platform: string, tone?: string) {
  try {
    let platformGuidance = platform === 'linkedin' 
      ? 'Professionell LinkedIn-ton. MAX 10 ord. EXAKT 1 hashtags. Behåll användarens budskap, polera bara språket lite.'
      : 'Casual Instagram-ton. MAX 10 ord. EXAKT 3 hashtags. Behåll användarens budskap.'

    let toneGuidance = ''
    switch(tone) {
      case 'professionell':
        toneGuidance = 'Använd en seriös, fakta-driven ton. Fokusera på data och konkreta resultat.'
        break
      case 'inspirerande':
        toneGuidance = 'Använd en visionär, motiverande ton. Fokusera på möjligheter och framtid.'
        break
      case 'engagerande':
        toneGuidance = 'Använd en personlig, conversational ton. Skriv som du pratar med en vän.'
        break
      case 'tankeväckande':
        toneGuidance = 'Använd en utmanande, frågande ton. Provocera tankar och diskussion.'
        break
      case 'konkret':
        toneGuidance = 'Använd en praktisk, actionable ton. Fokusera på konkreta steg och tips.'
        break
      default:
        toneGuidance = 'Använd en balanserad professionell ton.'
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `Du är en expert på ${platform}-innehåll. Polera texten till professionellt innehåll på svenska.`,
        },
        {
          role: 'user',
          content: `${platformGuidance}\n\n${toneGuidance}\n\nText att polera:\n${rawText}\n\nSvara med polerad text direkt (ingen JSON).`,
        },
      ],
    })

    return response.choices[0]?.message?.content || rawText
  } catch (error) {
    console.error('Error polishing text:', error)
    return rawText
  }
}
