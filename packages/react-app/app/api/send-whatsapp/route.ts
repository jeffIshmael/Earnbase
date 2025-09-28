import { NextRequest, NextResponse } from 'next/server';
import { getTemplateSuggestion } from '@/lib/Whatsapp';

const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const whatsappToken = process.env.WHATSAPP_TOKEN;

type WhatsAppParams = {
  taskTitle: string;
  creatorPhoneNo: string;
  participant: string;
  response: string;
  aiRating: string;
  Reward: string;
  TaskBalance: string;
};

export async function POST(request: NextRequest) {
  try {
    if (!whatsappPhoneId || !whatsappToken) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured' },
        { status: 500 }
      );
    }

    const params: WhatsAppParams = await request.json();

    // Template message payload - works without 24-hour window
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: params.creatorPhoneNo,
      type: 'template',
      template: {
        name: 'task_response_notification', // Your template name
        language: {
          code: 'en'
        },
        components: [
          {
            type: 'body',
            parameters: [
              { 
                type: 'text', 
                text: params.taskTitle 
              },
              { 
                type: 'text', 
                text: params.participant 
              },
              { 
                type: 'text', 
                text: params.aiRating 
              },
              { 
                type: 'text', 
                text: params.Reward 
              },
              { 
                type: 'text', 
                text: params.TaskBalance 
              },
              { 
                type: 'text', 
                // Truncate response if too long for WhatsApp
                text: params.response.length > 500 
                  ? params.response.substring(0, 500) + '...' 
                  : params.response
              }
            ]
          }
        ]
      }
    };

    console.log('Sending WhatsApp template message:', JSON.stringify(templatePayload, null, 2));

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${whatsappPhoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templatePayload),
      }
    );

    const result = await response.json();

    console.log('WhatsApp API Response Status:', response.status);
    console.log('WhatsApp API Response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('WhatsApp Template Error:', result);
      
      const errorDetails = {
        status: response.status,
        error: result.error,
        message: result.error?.message,
        code: result.error?.code,
        suggestion: getTemplateSuggestion(result.error)
      };
      
      return NextResponse.json(
        { 
          error: `WhatsApp template error: ${result.error?.message || 'Unknown error'}`,
          details: errorDetails
        },
        { status: 500 }
      );
    }

    console.log('WhatsApp template message sent successfully:', result);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      messageId: result.messages?.[0]?.id,
      recipientId: result.contacts?.[0]?.wa_id,
      templateUsed: 'task_response_notification'
    });
    
  } catch (error) {
    console.error('Error sending WhatsApp template message:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp template message', details: error},
      { status: 500 }
    );
  }
}

