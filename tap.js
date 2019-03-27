// Tapped!

// Utils
const over = arr => fn => arr.forEach(fn);
const isIn = arr => e => arr.includes(e);
const sleep = s => new Promise(res => setTimeout(res, s*1000));
const trim = s => s.trim();

// DOM Select
const allTaps = root => [...root.querySelectorAll("[tap]")];
const someTaps = root => name => [...root.querySelectorAll(`[tap=${name}]`)];
const tapNameAttr = e => e.getAttribute("tap");
const tapObj = tap =>
    ({[tapNameAttr (tap)]: F.prop ("innerText") (tap)});
const tapObjs = F.compose (
    F.reduce ((o, t) => F.merge (o) (tapObj (t))) ({}),
    allTaps,
    e => e.currentTarget
);


// DOM Checks

// DOM Updates
const setDisplay = v => e => e.style.display = v;
const show = setDisplay ("");
const hide = setDisplay ("none");
const addClick = fn => e => { e.onclick = e => fn(e, tapObjs (e)); return e; }
const drop = e => {e.parentNode.removeChild(e); return e;}
const setText = e => data => {e.innerText = data; return e;}

// DOM Adds
makeClone = e => {
    let clone = e.cloneNode(true);
    clone.onclick = F.prop ("onclick") (e);
    return clone;
}
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

const fillChildTaps = (parent, data) => {
    over (allTaps (parent)) (child => {
        F.compose (
            show,
            setText (child),
            F.flip (F.prop) (data),
            tapNameAttr
        ) (child);
    });
};

const addRows = (row, data) => {
    fillChildTaps (row, F.head (data));
    const rest = F.tail (data);
    if (F.emptyList (rest)) { return; }
    const nextRow = makeClone (row);
    addNext (row) (nextRow);
    addRows (nextRow, rest);
}

const _list = cfg => {
    const tapName = F.path (["data", "tap"]) (cfg);
    const data = F.path (["data", "data"]) (cfg);
    const rows = someTaps (document) (tapName);
    const baseRow = F.head (rows);
    over (F.tail (rows)) (drop);
    if (F.emptyList (data)) { hide(baseRow); }
    else { addRows (baseRow, data); }
};

const _init = cfg => F.prop ("fn") (cfg) ();

// Actions
const makeTap = taps => () => tapIt(taps);

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
