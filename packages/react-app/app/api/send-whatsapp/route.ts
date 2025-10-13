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
    // Authenticate the request
    if (request.headers.get("authorization") !== `Bearer ${process.env.EARNBASE_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!whatsappPhoneId || !whatsappToken) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured' },
        { status: 500 }
      );
    }

    const params: WhatsAppParams = await request.json();


    // Sanitize response text for WhatsApp (remove newlines, tabs, and excessive spaces)
    const sanitizeText = (text: string) => {
      return text
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .trim();
    };

    // Build ordered parameters intended for the body
    const allParams = [
      { type: 'text', text: params.taskTitle },
      { type: 'text', text: params.participant },
      { type: 'text', text: params.aiRating },
      { type: 'text', text: params.Reward },
      { type: 'text', text: params.TaskBalance },
      { 
        type: 'text', 
        text: sanitizeText(params.response).length > 500 
          ? sanitizeText(params.response).substring(0, 500) + '...'
          : sanitizeText(params.response)
      }
    ];

    // Try with decreasing parameter counts to handle template mismatch errors
    const candidateCounts = [allParams.length, 5, 4, 3, 2];
    let lastError: any = null;

    for (const count of candidateCounts) {
      const parameters = allParams.slice(0, count);

      const templatePayload = {
        messaging_product: 'whatsapp',
        to: params.creatorPhoneNo,
        type: 'template',
        template: {
          name: 'task_response_notification',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters
            }
          ]
        }
      };

      console.log(`Sending WhatsApp template with ${count} params:`, JSON.stringify(templatePayload, null, 2));

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

      if (response.ok) {
        console.log('WhatsApp template message sent successfully:', result);
        return NextResponse.json({ 
          success: true, 
          data: result,
          messageId: result.messages?.[0]?.id,
          recipientId: result.contacts?.[0]?.wa_id,
          templateUsed: 'task_response_notification',
          parametersUsed: count
        });
      }

      // If parameter mismatch/template errors, keep trying with fewer params
      const errorCode = result?.error?.code;
      const isParamMismatch = errorCode === 131049 || errorCode === 132018 || errorCode === 100;
      lastError = { responseStatus: response.status, result };
      if (!isParamMismatch) {
        break;
      }
    }

    // If we reach here, all attempts failed
    console.error('WhatsApp Template Error (all attempts failed):', lastError);
    const error = lastError?.result?.error;
    const errorDetails = {
      status: lastError?.responseStatus,
      error,
      message: error?.message,
      code: error?.code,
      suggestion: getTemplateSuggestion(error)
    };
    return NextResponse.json(
      { 
        error: `WhatsApp template error: ${error?.message || 'Unknown error'}`,
        details: errorDetails
      },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('Error sending WhatsApp template message:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp template message', details: error},
      { status: 500 }
    );
  }
}

