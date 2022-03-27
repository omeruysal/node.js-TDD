const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const nodemaillerStub = require('nodemailer-stub');
const EmailService = require('../src/email/EmailService');

beforeAll(() => {
  // We initialize our database
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true }); //Before each test method we clear our db , TODO: truncate?
});

// Mock object
const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'Password1',
};

const postUser = (user = validUser, options = {}) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200); //the expect() function comes with jest, not supertest
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to database', async () => {
    await postUser();
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('saves the username and email to database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('hashes the password in database', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('Password1');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email are null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'Password1',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it.each([
    //with it.each() we can run dynamic tests at once
    ['username', null, 'Username can not be null'],
    ['username', 'usr', 'Must have min 4 and max 32 characters'],
    ['username', 'a'.repeat(33), 'Must have min 4 and max 32 characters'],
    ['email', null, 'Email can not be null'],
    ['email', 'mail.com', 'Email is not valid'],
    ['email', 'user.mail.com', 'Email is not valid'],
    ['email', 'user@mail', 'Email is not valid'],
    ['password', null, 'Password can not be null'],
    ['password', 'P4ssw', 'Password must be at least 6 characters'],
  ])('when %s is  %s, %s is received', async (field, value, expectedMessage) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'Password1',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it('returns E-mail in use when same email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('Email in use');
  });

  it('returns errors for both username is null use and email is already in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'Password1',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('creates user in inactive mode', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even the request contains inactive as false', async () => {
    await postUser({
      ...validUser,
      inactive: false,
    });
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('creates an activationToken for user', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
    // null, undefined, '', 0, false, Nan are falsy, all values are truthy except falsy values
  });

  it('sends an Account activation email with activationToken', async () => {
    await postUser();
    const lastMail = nodemaillerStub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe('user1@mail.com');
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail.content).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser();
    expect(response.status).toBe(502);

    mockSendAccountActivation.mockRestore();
  });

  it('returns Email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser();
    expect(response.body.message).toBe('E-mail Failure');

    mockSendAccountActivation.mockRestore();
  });

  it('does not save user to database if activation email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });

    const response = await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);

    mockSendAccountActivation.mockRestore();
  });

  //  --------------- Created it.each() for the below test cases ----------------
  //   it('returns size validation error when username is less than 4 characters', async () => {
  //     const user = {
  //       username: 'usr',
  //       email: 'user1@email.com',
  //       password: 'Password1',
  //     };
  //     const response = await postUser(user);
  //     const body = response.body;
  //     expect(body.validationErrors.username).toBe('Must have min 4 and max 32 characters');
  //   });
  //   it('returns Username can not be null when username is null', async () => {
  //     const response = await postUser({
  //       username: null,
  //       email: 'user1@mail.com',
  //       password: 'Password1',
  //     });
  //     const body = response.body;
  //     expect(body.validationErrors.username).toBe('Username can not be null');
  //   });

  //   it('returns Email can not be null when email is null', async () => {
  //     const response = await postUser({
  //       username: 'user1',
  //       email: null,
  //       password: 'Password1',
  //     });
  //     const body = response.body;
  //     expect(body.validationErrors.email).toBe('Email can not be null');
  //   });

  //   it('returns Password can not be null when password is null', async () => {
  //     const response = await postUser({
  //       username: 'user1',
  //       email: 'user@mail.com',
  //       password: null,
  //     });
  //     const body = response.body;
  //     expect(body.validationErrors.password).toBe('Password can not be null');
  //   });
});
describe('Account activation', () => {
  it('activates the account when correct token is sent', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });
  it('removes the token from user table after successful activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    users = await User.findAll();
    expect(users[0].inactive).toBeFalsy();
  });

  it('does not activate the account when token is wrong', async () => {
    await postUser();
    const token = 'test token';

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('returns bad request when token is wrong', async () => {
    await postUser();
    const token = 'test token';

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    expect(response.status).toBe(400);
  });
  it.each`
    tokenStatus  | message
    ${'wrong'}   | ${'This account is either active or the token is invalid'}
    ${'correct'} | ${'Account is activated'}
  `('returns $message  when token status is $tokenStatus', async ({ tokenStatus, message }) => {
    await postUser();
    let token = 'test token';

    if (tokenStatus === 'correct') {
      let users = await User.findAll();
      token = users[0].activationToken;
    }

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();

    expect(response.body.message).toBe(message);
  });
});
// beforeAll(async () => {
//   server = new SMTPServer({
//     authOptional: true,
//     onData(stream, session, callback) {
//       console.log('first');
//       let mailBody;
//       stream.on('data', (data) => {
//         mailBody += data.toString();
//       });
//       stream.on('end', () => {
//         if (simulateSmtpFailure) {
//           const err = new Error('Invalid mailbox');
//           err.responseCode = 553;
//           return callback(err);
//         }
//         lastMail = mailBody;
//         callback();
//       });
//     },
//   });
//   await server.listen(8588, 'localhost');

//   // We initialize our database
//   return sequelize.sync();
// });
