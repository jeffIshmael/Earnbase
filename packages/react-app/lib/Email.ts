// this file has function to send the response via email

type responseEmail = {
  taskTitle: string;
  creatorEmail: string;
  participant: string;
  response: string;
  aiRating: string;
  Reward: string;
  TaskBalance: string;
};

export async function sendEmailResponse(params: responseEmail) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email notification');
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
