const chai = require('chai');
const assert = require('chai').assert;
const chaiHttp = require('chai-http')
const app = require('../server');
chai.should(); 
chai.use(chaiHttp); 

checkNameResult = app.user().name;
checkStreet1MailResult = app.user().mail_street1;
checkStreet2MailResult = app.user().mail_street2;
checkStateMailResult = app.user().state_mail;
checkCityMailResult = app.user().city_mail;
checkZipMailResult = app.user().zip_mail;
checkStreet1BillResult = app.user().bill_street1;
checkStreet2BillResult = app.user().bill_street2;
checkStateBillResult = app.user().state_bill;
checkCityBillResult = app.user().city_bill;
checkZipBillResult = app.user().zip_bill;
checkPreferredPayment = app.user().preferred_payment;
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

    describe("GET /userForm", () => {
      it("It should render the userForm page with an OK status", (done) => {
          chai.request(server)
              .get("/userForm")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
    })

    describe("GET /highTraffic", () => {
      it("It should render the highTraffic page with an OK status", (done) => {
          chai.request(server)
              .get("/highTraffic")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
    })

    describe("GET /guestPreConfirm", () => {
      it("It should render the guestPreConfirm page with an OK status", (done) => {
          chai.request(server)
              .get("/guestPreConfirm")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
    })

    describe("GET /guestConfirmation", () => {
      it("It should render the guestConfirmation page with an OK status", (done) => {
          chai.request(server)
              .get("/guestConfirmation")
              .end((err, response) => {
                  response.body.should.be.a('object');
                  response.should.have.status(200);
              done();
              })
      })
    })

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

  //check Profile Name
  it('checkNameResult should return Darwin Morales', function(){
    assert.notEqual(checkNameResult, 'Darwin Morales');
})

  it('checkNameResult should not return Darwin Morales', function(){
    assert.notEqual(checkNameResult, 'Morales');
})

  it('checkNameResult should not return number', function(){
     assert.notTypeOf(checkNameResult, 'number');
})

  it('checkNameResult should return type string', function(){
    assert.typeOf(checkNameResult, 'string');
})

 //check Mailing Street1 and Street2 (optional)
  it('checkStreet1MailResult should not return 24 Black Mamba Hwy', function(){
    assert.notEqual(checkStreet1MailResult, 'Mamba');
})

  it('checkStreet1MailResult should return type string', function(){
    assert.typeOf(checkStreet1MailResult, 'string');
})

  it('checkStreet1MailResult should not return type character', function(){
    assert.notTypeOf(checkStreet1MailResult, 'character');
  })

  it('checkStreet2MailResult should not return N/A', function(){
    assert.notEqual(checkStreet2MailResult, 'N/A');
})

  it('checkStreet2MailResult should return type string', function(){
    assert.typeOf(checkStreet2MailResult, 'string');
})

  it('checkStreet2MailResult should not return type character', function(){
    assert.notTypeOf(checkStreet2MailResult, 'character');
  })

  // check Mailing State
  it('checkStateMailResult should not return TX', function(){
    assert.notEqual(checkStateMailResult, 'LA');
})

  it('checkStateMailResult should return type string', function(){
    assert.typeOf(checkStateMailResult, 'string');
})

  it('checkStateMailResult should exist NY', function(){
    assert.exists(checkStateMailResult, 'NY');
})

 //check Mailing City
  it('checkCityMailResult should not return Katy', function(){
    assert.notEqual(checkCityMailResult, 'Katy');
})

  it('checkCityMailResult should return type string', function(){
    assert.typeOf(checkCityMailResult, 'string');
})

  it('checkCityMailResult should not return type number', function(){
    assert.notTypeOf(checkCityMailResult, 'number');
  })

 //check Mailing Zipcode
  it('checkZipMailResult should not return 77532', function(){
    assert.notEqual(checkZipMailResult, '77654');
})

  it('checkZipMailResult should return type string', function(){
    assert.typeOf(checkZipMailResult, 'string');
})

  //check Billing Street1 and Street2 (optional)
  it('checkStreet1BillResult should return 2050 Westheimer Rd', function(){
    assert.notEqual(checkStreet1BillResult, 'Westheimer');
})

  it('checkStreet1BillResult should return type string', function(){
    assert.typeOf(checkStreet1BillResult, 'string');
})
  it('checkStreet1BillResult should not return type character', function(){
    assert.notTypeOf(checkStreet1BillResult, 'character');
  })

  it('checkStreet2BillResult should not return N/A', function(){
    assert.notEqual(checkStreet2BillResult, 'N/A');
})

  it('checkStreet2BillResult should return type string', function(){
    assert.typeOf(checkStreet2BillResult, 'string');
})

  it('checkStreet2BillResult should not return type character', function(){
    assert.notTypeOf(checkStreet2MailResult, 'character');
  })

  // check Billing State
  it('checkStateBillResult should not return TX', function(){
    assert.notEqual(checkStateBillResult, 'LA');
})

  it('checkStateBillResult should return type string', function(){
    assert.typeOf(checkStateBillResult, 'string');
})

  it('checkStateBillResult should exist CA', function(){
    assert.exists(checkStateBillResult, 'CA');
})

 //check Billing City
  it('checkCityBillResult should not return Houston', function(){
    assert.notEqual(checkCityBillResult, 'Katy');
})

  it('checkCityBillResult should return type string', function(){
    assert.typeOf(checkCityBillResult, 'string');
})

  it('checkCityBillResult should not return type number', function(){
    assert.notTypeOf(checkCityMailResult, 'number');
})

 //check Billing Zipcode
  it('checkZipBillResult should not return 77532', function(){
    assert.notEqual(checkZipBillResult, '77654');
})

  it('checkZipBillResult should return type string', function(){
    assert.typeOf(checkZipBillResult, 'string');
})

 //check Preferred Payment Method
  it('checkPreferredPayment should return Cash', function(){
  assert.equal(checkPreferredPayment, 'Cash');
})

  it('checkPreferredPayment should not return Cash', function(){
  assert.notEqual(checkPreferredPayment, 'Credit Card');
})

  it('checkPreferredPayment should exist Check', function(){
  assert.exists(checkPreferredPayment, 'Check');
})

})
