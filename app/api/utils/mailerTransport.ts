import nodemailer from 'nodemailer';
import fakeMailer from '#api/utils/fakeMailer.js';

export const getMailerTransport = () =>
  process.env.DATABASE_NAME !== 'uwazi_e2e' ? nodemailer : fakeMailer;
