const chai = require('chai');
const assert = require('chai').assert;
const chaiHttp = require('chai-http')
const app = require('../server');
chai.should(); 
chai.use(chaiHttp); 
server = app.server

describe('Server', function(){
    describe('GET /profile', () => {
        it("It should render the profile page with an OK status", (done) => {
            chai.request(server)
                .get("/profile")
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                })
        })

        it("It should NOT render the profile page with an OK status", (done) => {
            chai.request(server)
                .get("/notprofile")
                .end((err, response) => {
                    response.should.have.status(404);
                done();
                })
        })
        it("It GET the updated client form to the profile", (done) => {
            const user = {
                full_name: 'Darwin Morales', 
                street1: '24 Black Mamba St', 
                street2: 'Ste 8',
                state: 'TX',
                city: 'Houston', 
                zip: '77532'
            }
            chai.request(server)
                .get("/profile")
                .send(user)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a('object');
                done();
                })
            })
    })

    describe("POST /login", () => {
        it("It should authenticate login", (done) => {
          const user = {
            username: "Darwin",
            password: "Morales",
          };
          chai
            .request(server)
            .post("/login")
            .send(user)
            .end((err, response) => {
              response.should.have.status(200);
              done();
            });
        });
        it("It should not authenticate login", (done) => {
          const user = {
            username: "zz",
            password: "test",
          };
          chai
            .request(server)
            .post("/login")
            .send(user)
            .end((err, response) => {
              response.should.have.status(200);
              done();
            });
        });
      });

})