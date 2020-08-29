import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Event } from '../models/event';
import { Participant } from '../models/participant';
import { each } from 'lodash';
const moment = require('moment');

export class PdfService {
  public static generate(event: Event, participants: Participant[]) {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    const printer = new PdfPrinter(fonts);
    const pdfDefinition: TDocumentDefinitions = {
      pageMargins: [40, 60, 40, 60],
      header: PdfService.generateHeader(event),
      content: [PdfService.generateParticipantsTable(participants)],
      footer: PdfService.generateFooter(event),
      styles: {},
      defaultStyle: {
        font: 'Helvetica',
      },
    };

    var pdfDoc = printer.createPdfKitDocument(pdfDefinition);

    return new Promise((resolve, reject) => {
      try {
        var chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private static generateHeader(event: Event): any {
    const m = moment(event.date);
    const dateTime = m.format('DD.MM.yyyy') + ' um ' + m.format('HH:mm');
    return {
      margin: [40, 20, 40, 10],
      columns: [
        {
          text:
            'Teilnehmerliste für ' + event.name + ' am ' + dateTime + ' Uhr',
          bold: true,
          width: '*',
          alignment: 'center',
        },
      ],
    };
  }

  private static generateParticipantsTable(participants: Participant[]): any {
    const tableBody: any[] = [
      [
        { text: 'Teilnehmer', bold: true, border: [true, true, false, true] },
        { text: 'Adresse', bold: true, border: [false, true, false, true] },
        { text: 'Email', bold: true, border: [false, true, false, true] },
        { text: 'Telefon', bold: true, border: [false, true, true, true] },
      ],
    ];
    each(participants, (participant: Participant) => {
      tableBody.push([
        { text: participant.name, border: [true, true, false, true] },
        {
          text: `${participant.street}, ${participant.zip} ${participant.city}`,
          border: [false, true, false, true],
        },
        { text: participant.email, border: [false, true, false, true] },
        { text: participant.phone, border: [false, true, true, true] },
      ]);
    });
    return {
      table: {
        widths: ['100%'],
        body: [
          [
            {
              border: [false, false, false, false],
              table: {
                widths: ['*', '*', '*', '*'],
                body: tableBody,
              },
            },
          ],
        ],
      },
    };
  }

  private static generateFooter(event: Event): any {
    return function (currentPage: number, pageCount: number) {
      return {
        margin: [40, 10, 40, 0],
        columns: [
          {
            text: 'CVJM Gärtringen',
            width: '*',
          },
          {
            text: 'Seite ' + currentPage.toString() + ' / ' + pageCount,
            width: '*',
            alignment: 'center',
          },
          {
            text: `powered by Stefan Strobel Software & Service Consulting`,
            width: '*',
            alignment: 'right',
          },
        ],
      };
    };
  }
}
