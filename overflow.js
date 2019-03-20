// DOM Checks
const gtZero = prop => F.compose (F.gt (0), F.prop (prop));
const isVisible = F.both (gtZero ("offsetWidth")) (gtZero ("offsetHeight"));
const nodeTypeIs = x => F.compose (F.equals (x), F.prop ("nodeType"));
const isElement = nodeTypeIs (1);
const isComment = nodeTypeIs (8);
const isTapComment = type => F.both (isComment) (F.compose (
    F.equals (type), x => x.slice(0, type.length), trim, F.prop("nodeValue")
))
const isStartTapComment = isTapComment ("tap");
const isEndTapComment = isTapComment ("/tap");

// DOM Updates
const toggleVisible = F.ifElse (isVisible, hide, show);

// DOM Adds
addListComments = e => {
    const listComment = document.createComment("tap list");
    const closeComment = document.createComment("/tap");
    e.insertBefore(listComment, e.childNodes[0]);
    e.appendChild(closeComment);
};
