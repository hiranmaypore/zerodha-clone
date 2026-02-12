/**
 * Calculator Routes
 * 
 * ⚠️ IMPORTANT: All calculators are STATELESS
 * - NO database storage of calculation inputs or results
 * - Pure computational endpoints only
 * - See /calculators/README.md for policy details
 */
const express = require('express');
const { sipCalculator } = require('../calculators/investment/sip');
const { stepUpSIPCalculator } = require('../calculators/investment/stepUpSip');
const { emiCalculator } = require('../calculators/investment/emi');
const { swpCalculator } = require('../calculators/investment/swp');
const { retirementCalculator } = require('../calculators/investment/retirement');
const { npsCalculator } = require('../calculators/investment/nps');
const { stpCalculator } = require('../calculators/investment/stp');
const { brokerageCalculator } = require('../calculators/brokerage/brokerageCalc');
const { foMarginCalculator } = require('../calculators/brokerage/foMargin');
const { blackScholesCalculator } = require('../calculators/brokerage/blackScholes');

const router = express.Router();

// Investment Calculators
router.post('/sip', sipCalculator);
router.post('/step-up-sip', stepUpSIPCalculator);
router.post('/emi', emiCalculator);
router.post('/swp', swpCalculator);
router.post('/retirement', retirementCalculator);
router.post('/nps', npsCalculator);
router.post('/stp', stpCalculator);

// Brokerage & Margin Calculators
router.post('/brokerage', brokerageCalculator);
router.post('/fo-margin', foMarginCalculator);
router.post('/black-scholes', blackScholesCalculator);

module.exports = router;
