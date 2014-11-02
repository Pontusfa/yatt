/**
 * Transforms a torrent file and persist it.
 */

var _ = require('underscore'),
    announceUrl = null,
    privateTracker = null,
    ranks = null,
    queries = null,
    bencode = require('bencode'),
    crypto = require('crypto');

function Model(user, form, data) {
    this._user = user;
    this._form = form;
    this._data = data;
    return this;
}

Model.prototype.registerCallbacks = function (callbacks) {
    this._callbacks = callbacks;
    return this;
};

Model.prototype.execute = function () {
    var form = this._form;

    this._verifyTorrent(); // this order gives user error
    this._verifyUser();    // higher priority, counter-intuitive :)

    if (_.isObject(this._alert)) {
        this._callbacks.errorCallback(this._alert);
        return;
    }

    this._modifyTorrent().
        _createHash().
        _escapeHash().
        _bytesToSize();

    form.torrentTags =
        !_.isEmpty(form.torrentTags) ?
            _.uniq(form.torrentTags.split(' ')) : //dupe-free tags array
            [];

    queries.addDocument({
            title: form.torrentTitle,
            description: form.torrentText,
            tags: form.torrentTags,
            category: form.torrentCategory,
            infoLink: form.torrentInfoLink,
            infoHash: this._infoHash,
            uploader: this._user.username,
            size: this._size,
            meta: this._torrentMeta
        },
        queries.TORRENTMODEL,
        this._queryCallback.bind(this));
};

Model.prototype._queryCallback = function(err, result){
    if (_.isObject(err)) {
        this._callbacks.errorCallback({type: 'error', message: 'uploadFail'});
    }
    else{
        this._callbacks.successCallback(result);
    }
};

/**
 * @private
 */
Model.prototype._verifyTorrent = function () {
    var alert = null,
        form = this._form;

    if (_.isEmpty(form.torrentTitle)) {
        alert = {type: 'error', message: 'noTitle'};
    }
    else if (_.isEmpty(form.torrentText)) {
        alert = {type: 'error', message: 'noText'};
    }
    else if (_.isEmpty(form.torrentCategory)) {
        alert = {type: 'error', message: 'noCategory'};
    }
    else if (!_.isEqual(form.vow, 'on')) {
        alert = {type: 'error', message: 'noVow'};
    }
    this._alert = alert;

    return this;
};

/**
 * @private
 */
Model.prototype._verifyUser = function () {
    var alert = null,
        user = this._user;

    if (!_.isObject(user)) {
        alert = {type: 'error', message: 'noUploader'};
    }
    else if (!_.isString(user.username)) {
        alert = {type: 'error', message: 'noUploaderName'};
    }
    else if (user.rank < ranks.UPLOADER) {
        alert = {type: 'error', message: 'notUploader'};
    }
    this._alert = alert;

    return this;
};

/**
 * @private
 */
Model.prototype._modifyTorrent = function () {
    var torrentMeta = bencode.decode(this._data, 'utf8');

    torrentMeta.info.pieces =
        bencode.decode(this._data).info.pieces; //todo: double decoding

    if (privateTracker) {
        torrentMeta.announce = announceUrl;
        torrentMeta.info.private = 1;
        delete torrentMeta['announce-list'];
    }
    else {
        torrentMeta.announce = torrentMeta.announce ?
            torrentMeta.announce :
            announceUrl;
        torrentMeta.info.private = 0;
    }

    delete torrentMeta['created by']; //no silly adverts/messages
    delete torrentMeta.comment;
    delete torrentMeta['creation date'];
    this._torrentMeta = torrentMeta;

    return this;
};

Model.prototype._createHash = function () {
    var shasum = crypto.createHash('sha1'),
        bencodedInfo = bencode.encode(this._torrentMeta.info);

    shasum.update(bencodedInfo);
    this._hexSum = shasum.digest('hex');

    return this;
};

Model.prototype._escapeHash = (function () {
    var unreserved = 'A B C D E F G H I J S O N K L M N O P' +
            ' Q R S T U V W X Y Za b c d e f g h i j s o n k l m' +
            ' n o p q r s t u v w x y z + 1 2 3 4 5 6 7 8 9 0 - _ . ~'.split(' '),
        delimiter = '%',
        step = 2;

    return function () {
        var index = 0,
            end = this._hexSum.length,
            result = '',
            tmp = '';

        while (index < end) {
            tmp = this._hexSum.slice(index, index + step);

            if (_.contains(unreserved, String.fromCharCode('0x' + tmp))) {
                result = result + String.fromCharCode('0x' + tmp);
            }
            else {
                result = result + delimiter + tmp;
            }

            index = index + step;

        }
        this._infoHash = result;

        return this;
    };

})();

/**
 * Calculates correct prefix size.
 * Thanks to http://stackoverflow.com/a/18650828/1131050
 * @private
 */
Model.prototype._bytesToSize = function () {
    var k = 1024,
        bytes = parseInt(this._torrentMeta.info.length),
        sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'],
        i = null,
        result = null;

    if (bytes === 0 || _.isNaN(bytes)) {
        result = '0 B';
    }
    else {
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
        result = (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
    }
    this._size = result;

    return this;
};

module.exports = function (config, queriesObject) {
    var site = config.site;

    ranks = site.ranks;
    queries = queriesObject;
    announceUrl = site.trackerUrl;
    privateTracker = site.private;

    module.exports = Model;

    return module.exports;
};
