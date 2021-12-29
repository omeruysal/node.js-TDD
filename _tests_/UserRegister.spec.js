const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');

beforeAll(() => {
  // We initialize our database
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true }); //Before each test method we clear our db , truncate?
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'Password1',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};

describe('User Registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200); //this expect comes with jest not supertest
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
      password: 'Password1',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'Password1',
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
      email: 'user1@email.com',
      password: 'Password1',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
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
