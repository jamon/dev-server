module.exports = {};
module.exports.rewriteUrl = function(path, replacePath) {
    return function(req, res, next) {
        var queryIndex = req.url.indexOf('?');
        var query = queryIndex >= 0 ? req.url.substr(queryIndex) : "";
        req.url = req.path.replace(path, replacePath) + query;
        console.log("rewriting ", req.originalUrl, req.url);
        next();
    };
};
