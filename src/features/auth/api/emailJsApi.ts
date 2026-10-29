import emailjs from '@emailjs/browser';

const SERVICE_ID = 'service_gczrgph';
const TEMPLATE_ID = 'template_ob4mh1c';
const PUBLIC_KEY = '1hlaUvReFm0XPVLqL';

export const sendOtpEmail = async (toName: string, toEmail: string, otpCode: string) => {
  try {
    const templateParams = {
      to_name: toName,
      to_email: toEmail,
      otp_code: otpCode,
    };

    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    return response.status === 200;
  } catch (error) {
    console.error('EmailJS Error:', error);
    return false;
  }
};
