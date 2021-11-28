const chai = require('chai');
const assert = require('chai').assert;
const helper = require('../helper');
const expect = require('chai').expect;
//const should = require('chai').should()
chai.should();

describe('Test Utilitiy functions', function() {

  describe('Test the getMinDate function', function() { 
    let num = 6; 
    const date = helper.getMinDate()
    it('the getMinDate() function should return a string', function() {
        assert.typeOf(date, 'string');
    })

    it('It should return a string of length 10', function() {
      assert.lengthOf(date, 10);
  })
    
  })

  describe('Test the get parseDate() function', () => {
    var isodate = new Date('31 October 2011 14:48 UTC').toISOString();
    var date = new Date('05 October 2011 14:48 UTC');
    const formattedDate = date.getMonth()+1 + "-" + date.getDay()+1 + "-" + date.getFullYear();
    const parsed = helper.parseDate(isodate)      
    it('the getMinDate() function should return a string', function() {
      expect(parsed).to.be.a('string');
    })

    it('It should return a string of length 10', function() {
      assert.lengthOf(parsed, 10);
    })

    it('It should return a convert an ISO Date to a regular date', function() {
      assert.equal(parsed, formattedDate);
    })
  })

  describe('Test the getFirstName() function', () => {
    const fullName = "Paul Igwemoh";
    const firstName = helper.getFirstName(fullName);
    it('It should return a string', ()=> {
      assert.typeOf(firstName, 'string')
    })

    it('It should have length of 4 ', ()=> {
      assert.lengthOf(firstName, 4)
    })

    it('It should return a first name', ()=> {
      assert.equal(firstName, 'Paul')
    })
  })
  
  describe('Test the getLastName() function', () => {
    const fullName = "Paul Igwemoh";
    const lastName = helper.getLastName(fullName);
    it('It should return a string', ()=> {
      assert.typeOf(lastName, 'string')
    })

    it('It should have length of 4 ', ()=> {
      assert.lengthOf(lastName, 7)
    })

    it('It should return a first name', ()=> {
      assert.equal(lastName, 'Igwemoh')
    })
  })

  describe('Test the highTrafficDays() function', () => {
    const christmasDay = new Date('25 December 2021 14:48 UTC')
    const thanksgiving = new Date('25 November 2021 14:48 UTC')
    const newYear = new Date('01 January 2021 14:48 UTC')
    const nonHoliday = new Date('22 November 2021 14:48 UTC')
    const weekend = new Date('27 November 2021 14:48 UTC')
    let christmas = helper.isHighTraffic(christmasDay)
    it('It should return a boolean', ()=> {
      assert.typeOf(christmas, 'boolean')
    })

    it('It should return true for Christmas Day', ()=> {
      assert.equal(christmas.toString(), "true")
    })

    it('It should return true for thanksgiving', ()=> {
      assert.equal(helper.isHighTraffic(thanksgiving).toString(), 'true')
    })

    it('It should return true for newYear', ()=> {
      assert.equal(helper.isHighTraffic(newYear).toString(), 'true')
    })

    it('It should return false for a weekday', ()=> {
      assert.equal(helper.isHighTraffic(nonHoliday).toString(), 'false')
    })

    it('It should return true for a weekend', ()=> {
      assert.equal(helper.isHighTraffic(weekend).toString(), 'true')
    })
  })

  describe('Test the getPreferredTable() function', () => {
    const myArr = [1,2,3,4,5,6,3,2,5,6,23,6,24,6,2,35];
    it('It should return an Array', ()=> {
      assert.typeOf(myArr, 'Array');
    })
    it('It should return a number', ()=> {
      assert.typeOf(helper.getPreferredTable(myArr), 'Number');
    })
    it('It should return the maximum value', () => {
      assert.equal(helper.getPreferredTable(myArr), 15)
    })
  })

  describe('Test the tableMinMax() function', () => {
    it('It should return an Array', ()=> {
      assert.typeOf(helper.tableMinMax(6), 'Array');
    })
  })
})