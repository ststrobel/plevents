import { CronJob } from 'cron';
import { Event } from './models/event';
import { getConnection } from 'typeorm';
const moment = require('moment');

export class CronService {
  jobs: CronJob[] = new Array<CronJob>();

  /**
   * regularly removes personal participants data from the database 4 weeks after the corresponding event
   */
  removeParticipantsData(): void {
    /*
    Seconds: 0-59
    Minutes: 0-59
    Hours: 0-23
    Day of Month: 1-31
    Months: 0-11 (Jan-Dec)
    Day of Week: 0-6 (Sun-Sat)
    */
    const job = new CronJob(
      '0 0 0 * * *',
      () => {
        const fourWeeksAgo = moment().hours(0).minutes(0).seconds(0).subtract(4, 'weeks');
        // find all events older than 4 weeks and delete them.
        // this will also cascade down to the participants
        getConnection()
          .createQueryBuilder()
          .delete()
          .from(Event)
          .where(`date < ${fourWeeksAgo.format('yyyy-MM-DD')}`)
          .execute();
        console.log(
          '\x1b[33mRemoving events and corresponding participants older than ' +
            fourWeeksAgo.format('DD.MM.yyyy') +
            '\x1b[0m'
        );
      },
      null,
      false,
      'Europe/Berlin'
    );
    job.start();
    this.jobs.push(job);
    console.log('\x1b[32mStarted cronjob to delete events and participants older than 4 weeks\x1b[0m');
  }
}
