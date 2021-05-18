/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
let mfields = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
let allfields = ["audit", "avg", "dept", "fail", "id", "instructor", "pass", "title", "uuid", "year",
    "address", "fullname", "furniture", "href", "lat", "lon", "name", "number", "seats", "shortname", "type"];
let allChecked, anyChecked, noneChecked;
CampusExplorer.buildQuery = () => {
    let current = document.getElementsByClassName("tab-panel active")[0];
    let order = getOrder(current.children.item(0).children[2], current.dataset.type);
    let transform = getTransform(current.children.item(0).children[4], current.dataset.type);
    let hasOrder = false;
    let hasTransform = false;
    let groups = getGroup(current.children.item(0).children[3], current.dataset.type);

    if(Object.keys(order).length >= 1){
        hasOrder = true;
    }

    if(Object.keys(transform).length >= 1 || groups.length>0){
        hasTransform = true;
    }

    let query = {
        WHERE: {},
        OPTIONS: {
            COLUMNS: [],...
            (hasOrder && {ORDER: {}})
        },...
            (hasTransform &&
                {TRANSFORMATIONS: {
                GROUP: [],
                APPLY: []}})
    };

    query["WHERE"] = getConditions(current.children.item(0).children[0], current.dataset.type);
    query["OPTIONS"]["COLUMNS"] = getColumns(current.children.item(0).children[1], current.dataset.type);

    if (hasOrder) {
        query["OPTIONS"]["ORDER"] = order;
    }

    if (hasTransform) {
        query["TRANSFORMATIONS"]["GROUP"] = groups;
        query["TRANSFORMATIONS"]["APPLY"] = getTransform(current.children.item(0).children[4], current.dataset.type);
    }
    return query;
};

function getConditions(conditions, type) {
    let controlGC = conditions.children[2].getElementsByClassName("control-group condition");
    let empty = {};
    if (type === "courses"){
        allChecked = document.getElementById("courses-conditiontype-all").checked;
        anyChecked = document.getElementById("courses-conditiontype-any").checked;
        noneChecked = document.getElementById("courses-conditiontype-none").checked;
    } else if (type === "rooms"){
        allChecked = document.getElementById("rooms-conditiontype-all").checked;
        anyChecked = document.getElementById("rooms-conditiontype-any").checked;
        noneChecked = document.getElementById("rooms-conditiontype-none").checked;
    }

    if (controlGC.length === 1) {
        if (noneChecked) {
            return getMSCompare(controlGC, type);
        } else {
            return compareBody(controlGC[0], type);
        }
    } else if (controlGC.length >= 2) {
        return getMSCompare(controlGC, type);
    } else {
        return empty;
    }
}

function getMSCompare(controlGC, type) {
    let conditionArray = [];
    let conditionContainer = {}
    let nest = {};
    for (let controlGCElement of controlGC) {
        conditionArray.push(compareBody(controlGCElement, type));
    }

    if (allChecked) {
        conditionContainer["AND"] = conditionArray;
    }
    if (anyChecked) {
        conditionContainer["OR"] = conditionArray;
    }
    if (noneChecked) {
        nest["OR"] = conditionArray;
        conditionContainer["NOT"] = nest;
    }

    return conditionContainer;
}

function compareBody(controlGC, type) {
    let controlFields = controlGC.getElementsByClassName("control fields")[0];
    let controlOperators = controlGC.getElementsByClassName("control operators")[0];
    let not = controlGC.getElementsByClassName("control not")[0].children[0].checked;
    let inputValue = controlGC.getElementsByClassName("control term")[0].getElementsByTagName("input")[0].value;
    let keyContainer = {};
    let notContainer = {};
    let mcompareContainer = {};
    let controlFieldValue = controlFields.children[0].options[controlFields.children[0].selectedIndex].value;
    let controlOperatorValue = controlOperators.children[0].options[controlOperators.children[0].selectedIndex].value;
    let inputKey;
    if (mfields.includes(controlFieldValue)) {
        inputValue = parseFloat(inputValue);
    }
    if (allfields.includes(controlFieldValue)) {
        if (type === "courses") {
            inputKey = "courses_" + controlFieldValue;
        } else if (type === "rooms") {
            inputKey = "rooms_" + controlFieldValue;
        }
    } else {
        inputKey = controlFieldValue;
    }
    keyContainer[inputKey] = inputValue;
    mcompareContainer[controlOperatorValue] = keyContainer;

    if (not) {
        notContainer["NOT"] = mcompareContainer
        return notContainer;
    }

    return mcompareContainer;
}

function getColumns(controlColumn, type) {
    let columnArray = [];
    columnArray = columnArray.concat(getKeys(controlColumn.getElementsByClassName("control field"), type));
    columnArray = columnArray.concat(getAnyKeys(controlColumn.getElementsByClassName("control transformation")));
    return columnArray;
}

function getAnyKeys(controlKeys){
    let checkedFields = []
    for (let controlKey of controlKeys) {
        let controlFieldValue = controlKey.children[0].value;
        if (controlKey.children[0].checked) {
            checkedFields.push(controlFieldValue);
        }
    }
    return checkedFields;
}

function getKeys(controlKeys, type){
    let checkedFields = []
    let inputKey;
    for (let controlKey of controlKeys) {
        let controlFieldValue = controlKey.children[0].value;
        if (controlKey.children[0].checked) {
            if (allfields.includes(controlFieldValue)) {
                if (type === "courses") {
                    inputKey = "courses_" + controlFieldValue;
                } else if (type === "rooms") {
                    inputKey = "rooms_" + controlFieldValue;
                }
            } else {
                inputKey = controlFieldValue;
            }
            checkedFields.push(inputKey);
        }
    }
    return checkedFields;
}

function getOrder(order, type) {
    let dropdownChildren = order.getElementsByClassName("control order fields")[0].children[0].children;
    let orderKeys = [];
    let orderContainer = {}
    for (let dropdownChild of dropdownChildren) {
        if (dropdownChild.selected) {
            if (allfields.includes(dropdownChild.value)) {
                if (type === "courses") {
                    orderKeys.push("courses_" + dropdownChild.value);
                } else if (type === "rooms") {
                    orderKeys.push("rooms_" + dropdownChild.value);
                }
            } else {
                orderKeys.push(dropdownChild.value);
            }
        }
    }

    if (orderKeys.length === 1) {
        if (order.getElementsByClassName("control descending")[0].children[0].checked) {
            orderContainer["dir"] = "DOWN";
            orderContainer["keys"] = orderKeys;
            return orderContainer;
        } else {
            return orderKeys[0];
        }
    }

    if (orderKeys.length > 1) {
        if (order.getElementsByClassName("control descending")[0].children[0].checked) {
            orderContainer["dir"] = "DOWN";
        }
        if (!(order.getElementsByClassName("control descending")[0].children[0].checked)) {
            orderContainer["dir"] = "UP";
        }
        orderContainer["keys"] = orderKeys;
        return orderContainer;
    }

    return orderContainer;
}

function getGroup(group, type) {
    return getKeys(group.getElementsByClassName("control field"), type);
}

function getTransform(transform, type) {
    let transformArray = [];
    let inputKey;
    for (let controlGT of transform.getElementsByClassName("control-group transformation")) {
        let controlTermContainer = {};
        let keyContainer = {};
        let controlOpChild = controlGT.getElementsByClassName("control operators")[0].children[0];
        let controlFieldChild = controlGT.getElementsByClassName("control fields")[0].children[0];
        let fieldValue = controlFieldChild.options[controlFieldChild.selectedIndex].value;
        if (allfields.includes(fieldValue)) {
            if (type === "courses") {
                inputKey = "courses_" + fieldValue;
            } else if (type === "rooms") {
                inputKey = "rooms_" + fieldValue;
            }
        } else {
            inputKey = fieldValue;
        }
        keyContainer[controlOpChild.options[controlOpChild.selectedIndex].value] = inputKey;
        controlTermContainer[controlGT.getElementsByClassName("control term")[0].children[0].value] = keyContainer;
        transformArray.push(controlTermContainer);
    }
    return transformArray;
}
