import nodemailer from 'nodemailer'
import { BadRequestException } from '../../exceptions';
import Mail from 'nodemailer/lib/mailer';
import { APP_EMAIL, APP_EMAIL_PASSWORD, APPLICATION_NAME } from '../../../config/config';

export const sendEmail = async ({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments = [],
}: Mail.Options): Promise<void> => {

    if (!to && !cc && !bcc) {
        throw new BadRequestException("Invalid Recipient")
    }
    if (!(html as string)?.length && !attachments?.length) {
        throw new BadRequestException("Invalid mail content");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: APP_EMAIL,
            pass: APP_EMAIL_PASSWORD
        }
    })

    const info = await transporter.sendMail({
        to,
        cc,
        bcc,
        html,
        subject,
        attachments,
        from: `"${APPLICATION_NAME}" <${APP_EMAIL}>`
    })

    console.log("Message Sent:", info.messageId)
};