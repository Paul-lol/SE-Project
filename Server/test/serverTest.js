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

          it("It GET the wrong client form to the profile", (done) => {
              const user = {
                  full_name: ' test', 
                  street1: '@test', 
                  street2: 'N/A',
                  state: 'AD',
                  city: 'Test123', 
                  zip: '0'
               }
                  chai.request(server)
                  .get("/notprofile")
                  .send(user)
                  .end((err, response) => {
                   response.should.have.status(404);
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

    describe("POST /login", () => {
        it("Password DOES exist", (done) => {
          const user = {
            password: "Morales"
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

        it("Password DOES NOT exist", (done) => {
          const user = {
            password: "1234"
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

    describe("POST /login", () => {
        it("Username DOES exist", (done) => {
          const user = {
            username: "Darwin"
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

        it("Username DOES NOT exist", (done) => {
          const user = {
            username: "Dar"
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

    describe("GET /", () => {
        it("Should get the home page with 200 status", (done) => {
            chai.request(server)
                .get("/")
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                })
        })
    })

    describe("GET /editProfile", () => {
        it("It should render the editProfile page with an OK status", (done) => {
            chai.request(server)
                .get("/editProfile")
                .end((err, response) => {
                    response.body.should.be.a('object');
                    response.should.have.status(200);
                done();
                })
        })

        it("It should not render the editProfile page with an OK status", (done) => {
            chai.request(server)
                .get("/editProfiles")
                .end((err, response) => {
                    response.body.should.be.a('object');
                    response.should.have.status(404);
                done();
                })
        })
    })
    
    describe("POST /editProfile", () => {
        it("It POST the user credentials to the server", (done) => {
            const user = {
                full_name: 'Darwin Morales', 
                street1: '24 Black Mamba St', 
                street2: 'Ste 8',
                state: 'TX',
                city: 'Houston', 
                zip: '77532'
            }
            chai.request(server)
                .post("/editProfile")
                .send(user)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a('object');
                done();
                })
        })

        it("It POST the wrong user credentials to the server", (done) => {
            const user = {
                full_name: 'Test', 
                street1: '24 Test St', 
                street2: ' ',
                state: 'LY',
                city: 'none', 
                zip: '0'
            }
            chai.request(server)
                .post("/editProfile")
                .send(user)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a('object');
                done();
                })
        })
    })
     
    describe("GET /register", () => {
        it("Should get the register page with 200 status", (done) => {
            chai.request(server)
                .get("/register")
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                })
        })
    })

    //describe("POST /register")

    describe("GET /guestRegister", () => {
      it("Should get the register page with 200 status", (done) => {
          chai.request(server)
              .get("/register")
              .end((err, response) => {
                  response.should.have.status(200);
              done();
              })
      })
  })

    //describe("POST /guestRegister")

    describe("GET /guestForm", () => {
      it("It should render the guestForm page with an OK status", (done) => {
          chai.request(server)
              .get("/guestForm")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
    })

    //describe("POST /guestForm") and validations

    describe("GET /logout", () => {
      it("It should logout with an OK status", (done) => {
          chai.request(server)
              .get("/logout")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
  
      it("It did not logout with an OK status", (done) => {
          chai.request(server)
              .get("/logoutt")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(404);
              done();
              })
      })
  })

})
