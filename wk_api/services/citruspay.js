/*
 * Copyright (c) 2014 Citrus Payment Solutions Pvt. Ltd.
 * All Rights Reserved. 
 *
 * This software is the proprietary information of CitrusPay.
 * Use is subject to license terms.
 */

var http = require('http');
var https = require('https');
var crypto = require('crypto');
var querystring = require('querystring');

exports.gateway = function(vanity, accessKey, secretKey) {
	return {
		// merchant config
		merchant_: {
			id: accessKey,
			key: secretKey,
			vanity: vanity
		},

		// charge endpoints configuration
		charge_: {
			protocol: https,
			options: {
                //host: 'admin.citruspay.com',
                host: 'sandboxadmin.citruspay.com',
				port: 443,
				path: '/api/v2/txn/create',
				method: 'POST'
			}
		},

		// refund endpoints configuration
		refund_: {
			protocol: https,
			options: {
                //host: 'admin.citruspay.com',
                host: 'sandboxadmin.citruspay.com',
				port: 443,
				path: '/api/v2/txn/refund',
				method: 'POST'
			}
		},

		// enquiry endpoints configuration
		enquire_: {
			protocol: https,
			options: {
                //host: 'admin.citruspay.com',
				host: 'sandboxadmin.citruspay.com',
				port: 443,
				path: '/api/v2/txn/enquiry',
				method: 'GET'
			},
			optionsFor: function(mtx) {
				return {
					host: this.options.host,
					port: this.options.port,
					path: this.options.path + '/' + mtx,
					method: this.options.method
				};
			}
		},

		// refund endpoints configuration
		search_: {
			protocol: https,
			options: {
                //host: 'admin.citruspay.com',
                host: 'sandboxadmin.citruspay.com',
				port: 443,
				path: '/api/v2/txn/search',
				method: 'POST'
			}
		},

		// paymentModes endpoint configuration
		paymentModes_: {
			protocol: https,
			options: {
                //host: 'admin.citruspay.com',
                host: 'sandboxadmin.citruspay.com',
				port: 443,
				path: '/service/v1/merchant/pgsetting',
				method: 'POST'
			}
		},

		// invoke the charge webservice
		charge: function(payment, callback) {
			// invoke moto v2 charge api
			var request = this.charge_.protocol.request(
				this.charge_.options, 
				function(response) {
					var body = '';
					response.on('data', function(data) { body += data; });
					response.on('end', function() {
						var pgr = JSON.parse(body);
						callback({
							respCode: pgr.respCode == undefined ? '200' : pgr.respCode,
							respMsg: pgr.respMsg == undefined ? 'Transaction successful' : pgr.respMsg,
							redirectUrl: pgr.redirectUrl
						});
					});
				}
			);
			request.setHeader('Accept', 'application/json');
			request.setHeader('Content-Type', 'application/json');
			request.setHeader('access_key', this.merchant_.id);
			request.setHeader('signature', sign(this.merchant_.id, this.merchant_.key, payment));
			request.write(JSON.stringify(payment));
			request.end();
		},

		// invoke the refund webservice
		refund: function(refund, callback) {
			var request = this.refund_.protocol.request(
				this.refund_.options,
				function(response) {
					var body = '';
					response.on('data', function(data) { body += data; });
					response.on('end', function() {
						callback(JSON.parse(body));
					});
				}
			);
			request.setHeader('Accept', 'application/json');
			request.setHeader('Content-Type', 'application/json');
			request.setHeader('access_key', this.merchant_.id);
			request.setHeader('signature', sign(this.merchant_.id, this.merchant_.key, refund));
			request.write(JSON.stringify(refund));
			request.end();
		},

		// invoke the enquiry webservice
        enquire: function (merchantTxnId, callback) {
        	console.log("Merchant Txn Id: "+merchantTxnId);
			var request = this.enquire_.protocol.request(
				this.enquire_.optionsFor(merchantTxnId),
				function(response) {
					var body = '';
					response.on('data', function(data) { body += data; });
					response.on('end', function() {
						callback(body);//callback(JSON.parse(body));
					});
				}
			);
			request.setHeader('Accept', 'application/json');
			request.setHeader('access_key', this.merchant_.id);
			request.end();
		},

		// invoke the search webservice
		search: function(criteria, callback) {
			var request = this.search_.protocol.request(
				this.search_.options,
				function(response) {
					var body = '';
					response.on('data', function(data) { body += data; });
					response.on('end', function() {
						callback(JSON.parse(body));
					});
				}
			);
			request.setHeader('Accept', 'application/json');
			request.setHeader('Content-Type', 'application/json');
			request.setHeader('access_key', this.merchant_.id);
			request.write(JSON.stringify(criteria));
			request.end();
		},

		// invoke merchant config retrieval webservice
		paymentModes: function(callback) {
			// invoke moto v2 charge api
			var request = this.paymentModes_.protocol.request(
				this.paymentModes_.options, 
				function(response) {
					var body = '';
					response.on('data', function(data) { body += data; });
					response.on('end', function() {
						console.log(body);
						callback(JSON.parse(body));
					});
				}
			);
			request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
			request.write(querystring.stringify({vanity: this.merchant_.vanity}));
			request.end();
		},

		// configure gateway for sandbox env integration
		sandbox: function() {
			// default merchant
		    this.merchant_.id = 'M8CQ4H6H3Y7Z15KQIPC7';
			this.merchant_.key = 'bb74017d4a98ff6e18cd0bfdec1c9d62a79b55a1';
			this.merchant_.vanity = 'testedURL';

			// endpoints to sandbox
			this.charge_.options.host = 'sandboxadmin.citruspay.com';
			this.refund_.options.host = 'sandboxadmin.citruspay.com';
			this.enquire_.options.host = 'sandboxadmin.citruspay.com';
			this.search_.options.host = 'sandboxadmin.citruspay.com';
			this.paymentModes_.options.host = 'sandboxadmin.citruspay.com';

			return this;
		},

		// configure gateway for local testing
		local: function() {
			// default merchant
		    this.merchant_.id = 'M8CQ4H6H3Y7Z15KQIPC7';
		    this.merchant_.key = 'bb74017d4a98ff6e18cd0bfdec1c9d62a79b55a1';
			this.merchant_.vanity = 'testedURL';

			// endpoints to local
			var api = [this.charge_, this.refund_, this.enquire_, this.search_, this.paymentModes_];
			for (i = 0; i < api.length; i++) {
				api[i].protocol = http;
				api[i].options.host = 'localhost';
				api[i].options.port = 8080;
				api[i].options.path = '/admin-site' + api[i].options.path;
			}

			return this;
		}
	};
};

function sign(id, key, request) {
    // create data load
    console.log("Sec sig");
	var data = 'merchantAccessKey=' + id
		+ '&transactionId=' + request.merchantTxnId
		+ '&amount=' + request.amount;

	// generate hmac
	var hmac = crypto.createHmac('sha1', key);
	hmac.update(data);
	return hmac.digest('hex');
}
