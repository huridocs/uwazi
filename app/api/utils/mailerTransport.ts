import nodemailer from 'nodemailer';
import fakeMailer from './fakeMailer';

export const getMailerTransport = () =>
  process.env.DATABASE_NAME !== 'uwazi_e2e' ? nodemailer : fakeMailer;
