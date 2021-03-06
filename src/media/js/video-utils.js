define('video-utils',
       ['l10n', 'jquery'],
       function(l10n, $) {

    function parseVideo(url) {
        // - Supported YouTube URL formats:
        //   - http://www.youtube.com/watch?v=My2FRPA3Gf8
        //   - http://youtu.be/My2FRPA3Gf8
        //   - https://youtube.googleapis.com/v/My2FRPA3Gf8
        //   - //www.youtube.com/embed/My2FRPA3Gf8
        // - Supported Vimeo URL formats:
        //   - http://vimeo.com/25451551
        //   - http://player.vimeo.com/video/25451551
        // - Also supports relative URLs:
        //   - //player.vimeo.com/video/25451551

        url.match(/(https?:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);

        if (RegExp.$3.indexOf('youtu') > -1) {
            var type = 'youtube';
        } else if (RegExp.$3.indexOf('vimeo') > -1) {
            var type = 'vimeo';
        }

        return {
            type: type,
            id: RegExp.$6
        };
    }

    function createVideoFromUrl(url, width, height) {
        var videoObj = parseVideo(url);
        return createVideoFromId(videoObj.id, videoObj.type, width, height);
        
    }

    function createVideoFromId(id, type, width, height) {
        var $iframe = $('<iframe>', {width: width, height: height});
        $iframe.attr('frameborder', 0);
        if (type === 'youtube') {
            $iframe.attr('src', '//www.youtube.com/embed/' + id);
        } else if (type === 'vimeo') {
            $iframe.attr('src', '//player.vimeo.com/video/' + id);
        }
        return $iframe;
    }

    function getVideoThumbnail(url, cb) {
        var videoObj = parseVideo(url);
        if (videoObj.type === 'youtube') {
            cb('//img.youtube.com/vi/' + videoObj.id + '/hqdefault.jpg');
        } else if (videoObj.type === 'vimeo') {
            $.get('http://vimeo.com/api/v2/video/' + videoObj.id + '.json', function(data) {
                cb(data[0].thumbnail_large);
            });
        }
    }

    return {
        parseVideo: parseVideo,
        createVideoFromUrl: createVideoFromUrl,
        createVideoFromId: createVideoFromId,
        getVideoThumbnail: getVideoThumbnail
    };
});
