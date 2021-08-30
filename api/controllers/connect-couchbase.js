/**
 * @author vikram.jakkampudi
 */
var couchbase = require('couchbase');
var reactConfig=require('../../config/ReactConfig');
config=reactConfig.init;
var oneDay = 86400;
var noop = function () {};

/**
 * Return the `CouchbaseStore` extending `express`'s session Store.
 *
 * @param {object} express session
 * @return {Function}
 * @api public
 */

module.exports = function(session){
    var Store = session.Store;//Express's session Store.
    function CouchbaseStore() {
        var self = this;
        Store.call(this, {});
        this.prefix = 'sess:';
        var cluster = new couchbase.Cluster("couchbase://"+config.cbAddress,{username:config.cbUsername,password:config.cbPassword});  
        this.bucket=cluster.bucket(config.sessionsBucket?config.sessionsBucket:"sessions");
        this.client=this.bucket.defaultCollection();
        this.ttl =  null;
    }

    /**
     * Inherit from `Store`.
     */

    CouchbaseStore.prototype.__proto__ = Store.prototype;

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */

    CouchbaseStore.prototype.get = async function(sid, fn){
        if ('function' !== typeof fn) { fn = noop; }
        sid = this.prefix + sid;
        try{
            var data = await this.client.get(sid);
            if (!data || !data.content) return fn();
            data=data.content.toString();
            var result=JSON.parse(data);
            return fn(null, result);
        }catch(err){
            console.log("error getting session "+sid);
            return fn();
        }
    };

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} fn
     * @api public
     */

    CouchbaseStore.prototype.set = async function(sid, sess, fn){
        if ('function' !== typeof fn) { fn = noop; }
        sid = this.prefix + sid;
        try {
            var maxAge = sess.cookie.maxAge
                , ttl = this.ttl
                , sess = JSON.stringify(sess);

            ttl = ttl || ('number' == typeof maxAge
                ? maxAge / 1000 | 0
                : oneDay);

            try{
                await this.client.upsert(sid,sess,{expiry:ttl},function(err){
                    fn && fn.apply(this, arguments);
                });
            }catch(err){
                console.log('Session Set complete in catch');
            }
        } catch (err) {
            console.log("Session upsert error 1")
            fn && fn(err);
        }
    };

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */

    CouchbaseStore.prototype.destroy = async function(sid, fn){
        if ('function' !== typeof fn) { fn = noop; }
        sid = this.prefix + sid;
        try{
            const result = await this.client.remove(sid,fn);
        }catch(err){
            console.log("Failed to remove session");
        }
    };


    /**
     * Refresh the time-to-live for the session with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @param {Function} fn
     * @api public
     */

    CouchbaseStore.prototype.touch = async function (sid, sess, fn) {
        if ('function' !== typeof fn) { fn = noop; }

        var maxAge = sess.cookie.maxAge
            , ttl = this.ttl;

        ttl = ttl || ('number' == typeof maxAge
                ? maxAge / 1000 | 0
                : oneDay);
        try{
            await this.client.getAndTouch(this.prefix + sid, ttl, fn);
        }catch(err){
            console.log("failed to touch session");
        }
    };

    return CouchbaseStore;
};
