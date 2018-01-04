import * as request from 'supertest';
import createApp from '../src/app';

const payload = {
  id: 'some-id'
};

describe('POST /html', () => {
  it('should success to render HTML', () => {
    expect.assertions(1);

    return createApp().then(app =>
      request(app)
      .post('/html')
      .send(payload)
      .expect(200)
      .expect('Content-Type', /html/)
      .then(res => {
        expect(res.text).toContain(payload.id);
      })
    );
  });

  it('should fail with incorrect payload', () => {
    expect.assertions(1);

    return createApp().then(app =>
      request(app)
      .post('/html')
      // Send incomplete delivery note view
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).toHaveProperty('message');
      })
    );
  });
});

describe('POST /pdf', () => {
  it('should success to render PDF', () => {
    return createApp().then(app =>
      request(app)
      .post('/pdf')
      .send(payload)
      .expect(200)
      .expect('Content-Type', /pdf/)
    );
  });

  it('should fail with incorrect payload', () => {
    expect.assertions(1);

    return createApp().then(app =>
      request(app)
      .post('/pdf')
      // Send incomplete delivery note view
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .then(res => {
        expect(res.body).toHaveProperty('message');
      })
    );
  });
});
