define('capabilities', ['settings'], function(settings) {
    function safeMatchMedia(query) {
        var m = window.matchMedia(query);
        return !!m && m.matches;
    }

    var static_caps = {
        'JSON': window.JSON && typeof JSON.parse === 'function',
        'debug': document.location.href.indexOf('dbg') >= 0,
        'debug_in_page': document.location.href.indexOf('dbginpage') >= 0,
        'console': window.console && typeof window.console.log === 'function',
        'replaceState': typeof history.replaceState === 'function',
        'chromeless': !!(window.locationbar && !window.locationbar.visible),
        'webApps': !!(navigator.mozApps && navigator.mozApps.install),
        'packagedWebApps': !!(navigator.mozApps && navigator.mozApps.installPackage),
        'userAgent': navigator.userAgent,
        'widescreen': function() { return safeMatchMedia('(min-width: 710px)'); },
        'firefoxAndroid': navigator.userAgent.indexOf('Firefox') !== -1 && navigator.userAgent.indexOf('Android') !== -1,
        'touch': !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch),
        'performance': !!(window.performance || window.msPerformance || window.webkitPerformance || window.mozPerformance),
        'navPay': !!navigator.mozPay,
        'webactivities': !!(navigator.setMessageHandler || navigator.mozSetMessageHandler),
        'firefoxOS': navigator.mozApps && navigator.mozApps.installPackage &&
                     navigator.userAgent.indexOf('Android') === -1 &&
                     (navigator.userAgent.indexOf('Mobile') !== -1 || navigator.userAgent.indexOf('Tablet') !== -1),
        'phantom': navigator.userAgent.match(/Phantom/)  // Don't use this if you can help it.
    };

    static_caps.persona = function() { return (!!navigator.id || !!navigator.mozId) && !static_caps.phantom; };

    static_caps.persona = function() {
        return ((!!navigator.id || !!navigator.mozId)
                && !static_caps.phantom
                && !static_caps.fallbackFxA());
    };
    static_caps.nativeFxA = function() {
        return (static_caps.firefoxOS
                && !!navigator.userAgent.match(/rv:32.0/)
                && settings.switches
                && settings.switches.indexOf('firefox-accounts') !== -1)
    };
    static_caps.fallbackFxA = function() {
        return (!static_caps.nativeFxA()
                && settings.switches
                && settings.switches.indexOf('firefox-accounts') !== -1);
    };


    // True if the login should inherit mobile behaviors such as allowUnverified.
    // The _shimmed check is for B2G where identity is native (not shimmed).
    static_caps.mobileLogin = function() { return static_caps.persona() && (!navigator.id._shimmed || static_caps.firefoxAndroid); };

    static_caps.device_type = function() {
        if (static_caps.firefoxOS) {
            return 'firefoxos';
        } else if (static_caps.firefoxAndroid) {
            if (static_caps.widescreen()) {  // TODO(buchets): Retire me
                return 'android-tablet';
            }
            return 'android-mobile';
        } else {
            return 'desktop';
        }
    };

    return static_caps;

});
