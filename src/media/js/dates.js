define('dates', ['underscore', 'format', 'l10n'], function(_, format, l10n) {
    var ngettext = l10n.ngettext;

    var unitFormatters = {
        s: function(n) { return ngettext('1 second', '{n} seconds', {n: n}); },
        m: function(n) { return ngettext('1 minute', '{n} minutes', {n: n}); },
        h: function(n) { return ngettext('1 hour', '{n} hours', {n: n}); },
        d: function(n) { return ngettext('1 day', '{n} days', {n: n}); },
        w: function(n) { return ngettext('1 week', '{n} weeks', {n: n}); },
        M: function(n) { return ngettext('1 month', '{n} months', {n: n}); },
        y: function(n) { return ngettext('1 year', '{n} years', {n: n}); }
    };

    var unitSizes = {
        s: 1,
        m: 60,
        h: 60 * 60,
        d: 60 * 60 * 24,
        w: 60 * 60 * 24 * 7,
        M: 60 * 60 * 24 * 30,
        y: 60 * 60 * 24 * 365
    };

    var unitOrdinality = ['y', 'M', 'w', 'd', 'h', 'm', 's'];

    function getDateUnitQuantities(date, referenceDate) {
        // TODO: Mark negative diffs so they can be handled differently
        // in the future (ie. adding an 'ago' vs 'from now' suffix)
        var diffInSeconds = Math.max((referenceDate - date) / 1000, 0);

        var unitQuantities = {};
        var remaining = Math.abs(diffInSeconds);
        unitOrdinality.forEach(function(unit) {
            var unitSize = unitSizes[unit];
            if (remaining >= unitSize) {
                var unitQuantity = Math.floor(remaining / unitSize);
                unitQuantities[unit] = unitQuantity;
                remaining -= unitQuantity * unitSize;
            }
        });

        return unitQuantities;
    }

    /*
    Forms a localized relative date string from a given Date object. 
    For example, '1 day, 3 hours'.

    Options:
        maxDisplayUnits: The maximum number of units to display, regardless of
            their spread. So if this were 2, and the regular output were
            '3 days, 2 hours, 5 minutes', the final output would instead be
            '3 days, 2 hours'.
        maxUnitSpread: The maximum spread of the displayed units. So if this
            were 2, and the regular output were '2 weeks, 1 day, 5 minutes',
            the final output would be '2 weeks, 1 day'.
        minUnit: The minimum unit that can be displayed in the string. Units
            are referenced using abbreviations of the following convention:
                's': seconds
                'm': minutes
                'h': hours
                'd': days
                'M': months
                'y': years
        referenceDate: The date to compare to. Defaults to Date.now().
    */
    function relativeDateString(date, opts) {
        opts = _.defaults(opts || {}, {
            maxDisplayUnits: 2,
            maxUnitSpread: 3,
            minUnit: 's',
            referenceDate: Date.now()
        });

        var unitQuantities = getDateUnitQuantities(date, opts.referenceDate);
        var dateString = '';

        var maxOrdinalityIndex = unitOrdinality.indexOf(opts.minUnit);
        if (maxOrdinalityIndex == -1) {
            maxOrdinalityIndex = unitOrdinality.length - 1;
        }

        var unitCount = 0;
        var firstUnitIdx = -1;
        unitOrdinality.forEach(function(unit, idx) {
            var quantity = unitQuantities[unit];
            if (!quantity) {
                // If we've reached the last displayable unit and haven't outputted
                // any units, just output zero for the min unit
                if (idx === maxOrdinalityIndex && unitCount == 0) {
                    quantity = 0;
                } else {
                    return;
                }
            }

            if (idx > maxOrdinalityIndex || 
                unitCount >= opts.maxDisplayUnits ||
                (firstUnitIdx != -1 && idx - firstUnitIdx >= opts.maxUnitSpread)) {
                return;
            }

            if (unitCount > 0) {
                dateString += ', ';
            } else {
                firstUnitIdx = idx;
            }

            dateString += unitFormatters[unit](quantity);
            unitCount++;
        });

        return dateString;
    }

    return {
        relativeDateString: relativeDateString,
        unitSizes: unitSizes
    };
});
