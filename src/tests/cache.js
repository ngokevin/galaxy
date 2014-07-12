(function() {
var a = require('assert');
var _ = require('underscore');
var assert = a.assert;
var eq_ = a.eq_;
var eeq_ = a.eeq_;
var feq_ = a.feq_;
var mock = a.mock;

var cache = require('cache');

test('cache set/has/get/bust', function(done) {
    var key = 'test:thisisatest';
    var str = 'foobartest';
    assert(!cache.has(key));
    cache.set(key, str);
    assert(cache.has(key));
    eq_(cache.get(key), str);
    assert(cache.has(key));
    cache.bust(key);
    assert(!cache.has(key));
    done();
});

test('cache raw access', function(done) {
    var key = 'test:thisisanothertest';
    var str = 'foobartest';
    cache.set(key, str);
    assert(cache.has(key));
    eq_(cache.raw[key], str);
    cache.bust(key);
    assert(!cache.has(key));
    eeq_(cache.raw[key], undefined);
    done();
});

test('cache non-strings', function(done) {
    var key = 'test:thisisyetanothertest';
    var str = 1234;
    cache.set(key, str);
    assert(cache.has(key));
    eeq_(cache.get(key), str);
    cache.bust(key);
    assert(!cache.has(key));
    done();
});

test('cache purge', function(done) {
    mock(
        'cache',
        {},
        function(cache) {
            var key = 'test1:';
            var str = 'poop';
            cache.set(key + 'foo', str);
            cache.set(key + 'abc', str);
            cache.set(key + 'bar', str);
            cache.purge();
            eq_(_.size(cache.raw), 0);
            assert(!cache.has(key + 'foo'));
            assert(!cache.has(key + 'abc'));
            assert(!cache.has(key + 'bar'));
            done();
        }
    );
});

test('cache purge filter', function(done) {
    mock(
        'cache',
        {
            settings: {
                offline_cache_enabled: function () { return false; }
            }
        },
        function(cache) {
            var key = 'test2:';
            var str = 'poop';
            cache.set(key + 'foo', str);
            cache.set(key + 'abc', str);
            cache.set(key + 'bar', str);
            cache.purge(function(k) {return k == key + 'abc';});
            eq_(_.size(cache.raw), 2);
            assert(cache.has(key + 'foo'));
            assert(!cache.has(key + 'abc'));
            assert(cache.has(key + 'bar'));
            done();
        }
    );
});

test('cache rewrite', function(done) {
    var key = 'test3:';
    var str = 'poop';
    cache.set(key + 'foo', str);
    cache.set(key + 'rewrite', str);
    cache.set(key + 'bar', str);
    assert(cache.has(key + 'foo'));
    assert(cache.has(key + 'rewrite'));
    assert(cache.has(key + 'bar'));

    cache.attemptRewrite(
        function(key) {return key.match(/rewrite/);},
        function(value, cache_key) {
            eq_(cache_key, key + 'rewrite');
            return 'not poop';
        }
    );
    assert(cache.has(key + 'foo'));
    assert(cache.has(key + 'rewrite'));
    assert(cache.has(key + 'bar'));

    eq_(cache.get(key + 'foo'), 'poop');
    eq_(cache.get(key + 'bar'), 'poop');
    eq_(cache.get(key + 'rewrite'), 'not poop');

    cache.bust(key + 'foo');
    cache.bust(key + 'bar');
    cache.bust(key + 'rewrite');
    assert(!cache.has(key + 'foo'));
    assert(!cache.has(key + 'rewrite'));
    assert(!cache.has(key + 'bar'));
    done();
});

test('cache rewrite limit', function(done) {
    var key = 'test4:';
    var str = 'poop';

    cache.purge();

    cache.set(key + 'foo', str);
    cache.set(key + 'abc', str);
    cache.set(key + 'bar', str);
    assert(cache.has(key + 'foo'));
    assert(cache.has(key + 'abc'));
    assert(cache.has(key + 'bar'));

    var arbitrary_limit = 2;

    cache.attemptRewrite(
        function(key) {return true;},
        function(value, cache_key) {
            return 'rewritten';
        }, arbitrary_limit
    );
    assert(cache.has(key + 'foo'));
    assert(cache.has(key + 'abc'));
    assert(cache.has(key + 'bar'));

    var count = 0;
    if (cache.get(key + 'foo') === 'rewritten') count++;
    if (cache.get(key + 'abc') === 'rewritten') count++;
    if (cache.get(key + 'bar') === 'rewritten') count++;

    eq_(count, arbitrary_limit);

    cache.bust(key + 'foo');
    cache.bust(key + 'bar');
    cache.bust(key + 'abc');
    assert(!cache.has(key + 'foo'));
    assert(!cache.has(key + 'abc'));
    assert(!cache.has(key + 'bar'));
    done();
});

test('cache rewrite on set', function(done) {
    var rewriters = [
        function(new_key, new_value, c) {
            if (new_key !== 'foo') {
                return;
            }
            return new_value.toUpperCase();
        }
    ];
    mock(
        'cache',
        {'rewriters': rewriters},
        function(cache) {
            cache.set('foo', 'bar');
            cache.set('zip', 'zap');
            eq_(cache.get('foo'), 'BAR');
            eq_(cache.get('zip'), 'zap');
            done();
        }
    );
});

test('cache chained rewrite on set', function(done) {
    var rewriters = [
        function(new_key, new_value, c) {
            if (new_key !== 'foo') {
                return;
            }
            return new_value.toUpperCase();
        },
        function(new_key, new_value, c) {
            if (new_key[0] !== 'f') {
                return;
            }
            return new_value + ' test';
        }
    ];
    mock(
        'cache',
        {'rewriters': rewriters},
        function(cache) {
            cache.set('foo', 'bar');
            cache.set('fart', 'zap');
            cache.set('abc', 'def');
            eq_(cache.get('foo'), 'BAR test');
            eq_(cache.get('fart'), 'zap test');
            eq_(cache.get('abc'), 'def');
            done();
        }
    );
});

test('cache deep rewrite on set', function(done) {
    var rewriters = [
        function(new_key, new_value, c) {
            if (new_key[0] !== 'f') {
                return;
            }
            c[new_key + ':deep'] += new_value;
            return null;  // Triggers an ignore.
        }
    ];
    mock(
        'cache',
        {'rewriters': rewriters},
        function(cache) {
            cache.raw['foo:deep'] = 'asdf';
            cache.raw['fart:deep'] = 'asdf';

            cache.set('foo', 'bar');
            cache.set('fart', 'zap');
            cache.set('abc', 'def');

            assert(!cache.has('foo'));
            assert(!cache.has('fart'));
            eq_(cache.get('abc'), 'def');

            eq_(cache.get('foo:deep'), 'asdfbar');
            eq_(cache.get('fart:deep'), 'asdfzap');
            done();
        }
    );
});

test('cache get_ttl', function(done) {
    mock(
        'cache',
        {
            settings: {
                offline_cache_enabled: function () { return true; },
                offline_cache_whitelist: {
                    '/api/v1/fireplace/consumer-info/': 60 * 60,  // 1 hour in seconds
                    '/api/v1/fireplace/search/featured/': 60 * 60 * 6,  // 6 hours
                    '/api/v1/apps/category/': 60 * 60 * 24  // 1 day
                }
            }
        },
        function (cache) {
            eq_(cache.get_ttl('https://omg.org/api/v1/fireplace/consumer-info/'),
                60 * 60 * 1000);  // 1 hour in microseconds
            eq_(cache.get_ttl('https://omg.org/api/v1/apps/category/'),
                60 * 60 * 24 * 1000);  // 1 hour in microseconds
            eq_(cache.get_ttl('https://omg.org/api/v1/swag/yolo/foreva/'), null);
            done();
        }
    );
});

test('cache flush_signed', function(done) {
    mock(
        'cache',
        {
            user: {
                logged_in: function() { return true; },
                get_setting: function(x) {},
                get_token: function() { return 'SwaggasaurusRex';}
            }
        },
        function (cache) {
            var data = 'ratchet data';

            var signed_url = 'https://omg.org/api/v1/app/yolo/?_user=SwaggasaurusRex';
            cache.set(signed_url, data);
            eq_(cache.get(signed_url), data);

            var unsigned_url = 'https://omg.org/api/v1/app/swag/';
            cache.set(unsigned_url, data);
            eq_(cache.get(unsigned_url), data);

            feq_(Object.keys(cache.cache).sort(), [unsigned_url, signed_url]);

            // Calling this should clear all cache keys whose URLs contain
            // `_user=<token>`.
            cache.flush_signed();

            feq_(Object.keys(cache.cache), [unsigned_url]);

            done();
        }
    );
});

test('cache flush_expired', function(done) {
    mock(
        'cache',
        {
            settings: {
                offline_cache_enabled: function () { return true; },
                offline_cache_whitelist: {
                    '/api/v1/fireplace/consumer-info/': 60 * 60,  // 1 hour in seconds
                    '/api/v1/fireplace/search/featured/': 60 * 60 * 6,  // 6 hours
                    '/api/v1/apps/category/': 60 * 60 * 24  // 1 day
                }
            }
        },
        function (cache) {
            // Both were just added and unexpired ...
            cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                '__time': +new Date()
            });
            cache.set('https://omg.org/api/v1/fireplace/search/featured/', {
                '__time': +new Date()
            });
            cache.flush_expired();
            assert(cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
            assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));

            // Neither has expired ...
            cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                '__time': +new Date() - (60 * 59 * 1000)  // 59 min ago in microseconds
            });
            cache.flush_expired();
            assert(cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
            assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));

            // One has expired!
            cache.set('https://omg.org/api/v1/fireplace/consumer-info/', {
                '__time': +new Date() - (60 * 65 * 1000)  // 1 hr 5 min ago in microseconds
            });
            cache.flush_expired();
            assert(!cache.has('https://omg.org/api/v1/fireplace/consumer-info/'));
            assert(cache.has('https://omg.org/api/v1/fireplace/search/featured/'));

            done();
        }
    );
});

})();
