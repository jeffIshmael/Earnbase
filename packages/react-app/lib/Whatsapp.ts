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
        'Authorization': `Bearer ${process.env.EARNBASE_SECRET}`,
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

// Helper function for template-specific error suggestions
export function getTemplateSuggestion(error: any): string {
    if (!error) return 'Unknown error occurred';
    
    switch (error.code) {
      case 132018:
        return 'Template parameter issue. Ensure the number and order of parameters match the approved template, and values meet variable type/length rules.';
      case 131026:
        return 'Template "task_response_notification" does not exist or is not approved. Create it in Meta Business Manager.';
      case 131047:
        return 'Template is not approved yet. Check status in Meta Business Manager.';
      case 131049:
        return 'Template parameter mismatch. Check that you have exactly 6 parameters.';
      case 131051:
        return 'Invalid template format. Verify template structure in Meta Business Manager.';
      case 132000:
        return 'Template is paused or disabled. Enable it in Meta Business Manager.';
      case 100:
        return 'Invalid parameter values. Check phone number format and parameter content.';
      case 190:
        return 'Access token expired. Update your WHATSAPP_TOKEN environment variable.';
      default:
        return `Template error code ${error.code}: Check template status in Meta Business Manager.`;
    }
  }
  
  // Optional: Function to check template status
  export async function checkTemplateStatus(templateName: string = 'task_response_notification', whatsappToken: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates?name=${templateName}`,
        {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
          },
        }
      );
  
      const result = await response.json();
      console.log('Template status:', result);
      return result;
    } catch (error) {
      console.error('Template status check error:', error);
      return null;
    }
  }
