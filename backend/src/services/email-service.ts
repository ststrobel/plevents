import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { each } from 'lodash';
const fs = require('fs');

export enum EMAIL_TEMPLATES {
  REGISTER = 'register',
  PASSWORD_RESET = 'password-reset',
  JOIN_TENANT = 'join',
  NEW_TENANT = 'new-tenant',
  PENDING_USER_APPROVAL = 'pending-user',
}

export class EmailService {
  private static singleton: EmailService = null;
  private mailer: Mail = null;
  private templateTitles: Map<string, string> = new Map<string, string>([
    [EMAIL_TEMPLATES.PASSWORD_RESET, 'Passwort Reset Anfrage'],
    [EMAIL_TEMPLATES.REGISTER, 'Registrierung abschließen'],
    [EMAIL_TEMPLATES.JOIN_TENANT, 'Einladung erhalten'],
    [EMAIL_TEMPLATES.NEW_TENANT, 'Neuer Tenant'],
    [EMAIL_TEMPLATES.PENDING_USER_APPROVAL, 'Neue Nutzeranfrage'],
  ]);

  /**
   * get the service instance
   */
  static get(): EmailService {
    if (EmailService.singleton === null) {
      EmailService.singleton = new EmailService();
    }
    if (EmailService.singleton.mailer === null) {
      // create reusable transporter object using the default SMTP transport
      EmailService.singleton.loadSmtpConfig();
    }
    return EmailService.singleton;
  }

  /**
   * sends a defined email template to a given mail address
   * @param template
   * @param to
   */
  send(template: EMAIL_TEMPLATES, to: string, params: Object = null): void {
    this.mailer
      .sendMail({
        from: '"Plevents - Einfach erfassen" <no-reply@plevents.de>',
        to: to,
        subject: this.templateTitles.get(template),
        html: this.parseTemplate(template, params),
      })
      .then(() => {
        // success, nothing to do
      })
      .catch(error => {
        console.error(error);
      });
  }

  /**
   * read the template file and replace all its placeholders
   * @param templateName
   * @param params
   */
  private parseTemplate(templateName: string, params?: Object): string {
    let content: string = fs.readFileSync(
      `email-templates/${templateName}.template`,
      'utf8'
    );
    if (params) {
      each(Object.keys(params), (key: string) => {
        // try to replace the (possible) placeholder in the template
        const regex = new RegExp(`\{\{${key}\}\}`, 'g');
        content = content.replace(regex, params[key]);
      });
    }
    return content;
  }

  /**
   * (re)load the configuration from the .env file
   */
  private loadSmtpConfig(): void {
    try {
      // create reusable transporter object using the default SMTP transport
      this.mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } catch (e) {
      console.error(e);
      this.mailer = null;
    }
  }
}
