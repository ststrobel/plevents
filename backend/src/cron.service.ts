import { CronJob } from 'cron';
import { Event } from './models/event';
import { getConnection } from 'typeorm';
import { Tenant } from './models/tenant';
import { each } from 'lodash';
import moment from 'moment';

export class CronService {
  jobs: CronJob[] = new Array<CronJob>();

  /**
   * regularly removes personal participants data from the database 4 weeks after the corresponding event. runs every day at midnight.
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
        const fourWeeksAgo = moment()
          .hours(0)
          .minutes(0)
          .seconds(0)
          .subtract(4, 'weeks');
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
    console.log(
      '\x1b[32mStarted cronjob to delete events and participants older than 4 weeks\x1b[0m'
    );
  }

  /**
   * regularly check the lincense state of all tenants. runs every day at midnight.
   */
  checkTenantLicenses(): void {
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
        getConnection()
          .createQueryBuilder()
          .select('tenant')
          .from(Tenant, 'tenant')
          .where(`subscriptionUntil < NOW()`)
          .getMany()
          .then((tenants: Tenant[]) => {
            each(tenants, tenant => {
              tenant.active = false;
              tenant.subscriptionUntil = null;
              tenant.save();
            });
          });
      },
      null,
      false,
      'Europe/Berlin'
    );
    job.start();
    this.jobs.push(job);
    console.log('\x1b[32mStarted cronjob to monitor tenant licenses\x1b[0m');
  }
}
