import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const extractEventsFromImage = async (base64Image, apiKey) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all scheduled events from this image. Return a JSON array of events with these properties: title, date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM), location, and description. Format dates and times consistently."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Parse the response to extract and format events
    try {
      const content = response.data.choices[0].message.content;
      // Extract the JSON part if embedded in text
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/\[\n?\s*{\n[\s\S]*}\n?\s*\]/);
      
      const jsonText = jsonMatch ? jsonMatch[1] : content;
      const events = JSON.parse(jsonText);
      
      return events.map(event => ({
        title: event.title,
        start: `${event.date}T${event.startTime}`,
        end: `${event.date}T${event.endTime}`,
        location: event.location || '',
        description: event.description || '',
      }));
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse schedule data from the image');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

export const createEventFromText = async (prompt, apiKey) => {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that extracts event details from natural language descriptions. 
            
            Current date: ${new Date().toISOString().split('T')[0]}
            
            Extract the following fields:
            - title: The name of the event
            - date: The date in YYYY-MM-DD format. If a relative date like "tomorrow", "next week", etc. is provided, convert it to the actual date based on current date.
            - startTime: The start time in 24-hour format (HH:MM). If missing, use a reasonable default like "09:00".
            - endTime: The end time in 24-hour format (HH:MM). If missing, assume 1 hour after start time.
            - location: Where the event takes place. If missing, leave blank.
            - description: Any additional details. If missing, leave blank.
            
            Return ONLY a valid JSON object with these fields.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                      content.match(/{\n[\s\S]*}/);
    
    const jsonText = jsonMatch ? jsonMatch[1] : content;
    const event = JSON.parse(jsonText);
    
    // Format the event for our system
    return {
      title: event.title,
      start: event.startDateTime || `${event.date}T${event.startTime || '09:00'}`,
      end: event.endDateTime || `${event.date}T${event.endTime || '10:00'}`,
      location: event.location || '',
      description: event.description || '',
    };
  } catch (error) {
    console.error('Error processing text with OpenAI:', error);
    throw error;
  }
}; 