// Tapped!

// Utils
const over = arr => fn => arr.forEach(fn);
const isIn = arr => e => arr.includes(e);
const sleep = s => new Promise(res => setTimeout(res, s*1000));
const trim = s => s.trim();

// DOM Select
const allTaps = root => [...root.querySelectorAll("[tap]")];
const someTaps = root => name => [...root.querySelectorAll(`[tap=${name}]`)];
const tapName = e => e.getAttribute("tap");

// DOM Checks

// DOM Updates
const setDisplay = v => e => e.style.display = v;
const show = setDisplay ("");
const hide = setDisplay ("none");
const addClick = fn => e => e.addEventListener("click", fn);
const drop = e => e.parentNode.removeChild(e);
const text = data => e => e.innerText = data;

// DOM Adds
makeClone = e => e.cloneNode(true);
addNext = e => newE => e.parentNode.insertBefore(newE, e.nextSibling);

// Reducers
const _visibility = type => F.compose (
    taps => over (taps) (tap => over (someTaps (document) (tap)) (type)),
    F.prop ("taps")
);

const _click = cfg => {
    over (F.prop ("taps") (cfg)) (c => {
        over (F.compose (someTaps (document), F.head) (c)) (addClick (F.last (c)));
    });
};

const _listElement = (ele, row) => {
    over (allTaps (ele)) (e => { text (row[tapName (e)]) (e); show (e); });
    show(ele);
};

const _listElements = (lastEle, rows) => {
    if (F.emptyList (rows)) { return; }
    const e = makeClone (lastEle);
    addNext (lastEle) (e);
    _listElement (e, F.head (rows));
    _listElements (e, F.tail (rows));
}

const _list = cfg => {
    const listData = F.path (["data", "data"]) (cfg);
    const tap = F.path (["data", "tap"]) (cfg);
    const eles = someTaps (document) (tap);
    const ele = F.head (eles);
    over (F.tail (eles)) (drop);
    if (F.emptyList (listData)) {
        hide(ele);
    } else {
        _listElement (ele, F.head (listData));
        _listElements (ele, F.tail (listData));
    }
};

const _init = cfg => F.prop ("fn") (cfg) ();

// Actions
const actions = {
    SHOW: _visibility (show),
    HIDE: _visibility (hide),
    CLICK: _click,
    INIT: _init,
    LIST: _list
};

// Action Creators
const tapShow = taps => ({action: "SHOW", taps});
const tapHide = taps => ({action: "HIDE", taps});
const tapClick = taps => ({action: "CLICK", taps});
const tapList = tap => data => ({tap, data});
const tapLoad = data => ({action: "LIST", data});
const tapInit = fn => ({action: "INIT", fn});

// Dispatch
const dispatch = F.compose (F.flip (F.prop) (actions), F.prop ("action"));
const tapIt = cfg => over (cfg) (c => { dispatch (c) (c); });
