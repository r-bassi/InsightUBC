/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */

CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        let curURL = window.location.href;
        curURL = curURL.concat("query");
        xhr.open("POST", curURL, true);
        xhr.onload = function() {
            if (xhr.status != 200) { // analyze HTTP status of the response
                reject(JSON.parse(xhr.response)); // e.g. 404: Not Found
            } else { // show the result
                resolve(JSON.parse(xhr.response));
            }
        };
        xhr.send(JSON.stringify(query));
        xhr.onerror = function() {
            reject("Request failed");
        };
    });
};
