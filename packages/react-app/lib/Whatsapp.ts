// this file has function to send the response via whatsapp

type responseWhatsapp = {
  taskTitle: string;
  creatorPhoneNo: string;
  participant: string;
  response: string;
  aiRating: string;
  Reward: string;
  TaskBalance: string;
};

export async function sendWhatsappResponse(params: responseWhatsapp) {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle token expiry specifically
      if (errorData.code === 'TOKEN_EXPIRED') {
        throw new Error('WhatsApp service is temporarily unavailable. Please try again later.');
      }
      
      throw new Error(errorData.error || 'Failed to send WhatsApp message');
    }

    const result = await response.json();
    console.log('WhatsApp message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
