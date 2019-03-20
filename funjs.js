// Identities
// identity :: a -> a
var F = {};

F.identity = x => x;

// always :: a -> * -> a
F.always = a => (...b) => a;

// defer :: (a -> b) -> a -> * -> b
F.defer = fn => val => (...x) => fn (val);

// complement :: (a -> Boolean) -> a -> Boolean
F.complement = fn => a => !fn (a);

// T :: a -> * -> Boolean
F.T = F.always (true);

// F :: a -> * -> Boolean
F.F = F.always (false);

// isNone :: a -> Boolean
F.isNone = a => (a == undefined || a == null) ? true: false;

// notNone :: a -> boolean
F.notNone = F.complement (F.isNone);

// flip :: (a -> b -> c) -> b -> a -> c
F.flip = fn => b => a => fn (a) (b);

// higher order functions
// map :: (a -> b) -> [a] -> [b]
F.map = fn => arr => arr.map(fn);

// filter :: (a -> Boolean) -> [a] -> [a]
F.filter = fn => arr => arr.filter(fn);

// reduce :: (a -> b -> a) -> a -> [b] -> a"""
F.reduce = fn => init => arr => arr.reduce(fn, init);

// Composition
// compose :: ((y -> z) ... (a -> b)) -> a -> z
F.compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

F.composeP = (...fns) => x =>
    fns.reduceRight((v, f) => Promise.resolve(v).then(f), x);

// pipe :: ((a -> b) ... (y -> z)) -> a -> z
F.pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

F.pipeP = (...fns) => x =>
    fns.reduce((v, f) => Promise.resolve(v).then(f), x);

// Conditions
// ifElse :: ((a -> Boolean), (a -> b), (a -> c)) -> a -> b | c
F.ifElse = (pred, ok, notOk) => a => pred (a) ? ok (a) : notOk (a);

// when :: ((a -> Boolean), (a -> b)) -> a -> b | a
F.when = (pred, ok) => F.ifElse (pred, ok, F.identity)

// unless :: ((a -> Boolean), (a -> b)) -> a -> a | b
F.unless = (pred, ok) => F.ifElse (pred, F.identity, ok)

// both :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
F.both = fn1 => fn2 => a => (fn1 (a) && fn2 (a)) ? true : false;

// eitherOr :: (a -> Boolean) -> (a -> Boolean) -> a -> Boolean
F.eitherOr = fn1 => fn2 => a => (fn1 (a) || fn2 (a)) ? true : false;

// lt :: a -> b -> Boolean
F.lt = a => b => (b < a) ? true : false;

// gt :: a -> b -> Boolean
F.gt = a => b => (b > a) ? true : false;

// equals :: a -> b -> Boolean
F.equals = a => b => (b === a) ? true : false;

// lte :: a -> b -> Boolean
F.lte = a => b => F.eitherOr (F.equals (a)) (F.lt (a)) (b)

// gte :: a -> b -> Boolean
F.gte = a => b => F.eitherOr (F.equals (a)) (F.gt (a)) (b)

// notEmptyList :: [a] -> Boolean
F.notEmptyList = a => (a.length > 0) ? true : false; 

// emptyList :: [a] -> Boolean
F.emptyList = a => (a.length == 0) ? true : false; 

// Accessors
// head :: [a] -> a
F.head = arr => arr[0]

// last :: [a] -> a
F.last = arr => arr[arr.length-1];

// nth :: a -> [b] -> b
F.nth = idx => arr => arr[idx];

// tail :: [a] -> [a]
F.tail = arr => arr.slice(1);

// prop :: a -> {b} -> b[a]
F.prop = a => b => b[a];

// path :: [a] -> {b} -> b[a[0]]...[a[-1]]
F.path = keys => obj => F.reduce ((a, b) => F.prop (b) (a)) (obj) (keys);

// pick :: [a] -> {b} -> {b}
F.pick = keys => obj => {
    const grab = (keys, initObj, newObj = {}) => {
        return F.ifElse (
            F.emptyList,
            F.always (newObj),
            keys => {
                const key = F.head (keys);
                const x = {};
                x[key] = F.prop (key) (initObj);
                return grab (F.tail (keys), initObj, {...newObj, ...x});
            }
        ) (keys);
    }
    return grab(keys, obj);
}


// Access and Compare
// propEq :: a -> b -> {c} -> Boolean
F.propEq = key => val => F.compose (F.equals (val), F.prop (key))

// pathEq :: [a] -> b -> {c} -> Boolean
F.pathEq = key => val => F.compose (F.equals (val), F.path (key))

// cond :: [[(a -> Boolean), (a -> b)]] -> a -> b
F.cond = conds => x => F.ifElse (
   F.compose(F.head, F.head)(conds),
   F.compose(F.last, F.head)(conds),
   F.cond(F.tail(conds))
) (x)

// Operations
// inc :: a -> b
F.inc = x => x + 1;

// merge :: {a} -> {b} -> {ab}
F.merge = f => g => ({...f, ...g});

// trim :: a -> b
F.trim = x => x.trim();

// assoc :: a -> b -> {c} -> {c}
F.assoc = key => val => obj => {x = {}; x[key] = val; return F.merge (obj) (x)};

// evolve :: a -> (b -> c) -> {d} -> {dc}
F.evolve = k => f => o => F.assoc (k) (f (F.prop (k) (o))) (o);

// evolvePath :: [a] -> (b -> c) -> {d} -> {dc}
F.evolvePath = keys => fn => obj => F.compose (
    v => F.assoc (F.head (keys)) (v) (obj),
    F.ifElse (
        F.compose (F.lte (1), x => x.length),
        F.compose (fn, F.flip (F.prop) (obj), F.head),
        F.compose (
            F.evolvePath (F.tail (keys)) (fn),
            F.flip (F.prop) (obj),
            F.head
        ),
    )
) (keys)

// assocPath :: [a] -> b -> {c} -> {c}
F.assocPath = keys => val => F.evolvePath (keys) (F.always (val))

// append :: a -> [a] -> [a]
F.append = item => arr => [...arr, item];

// Monads (Generic)
// result :: (a -> Boolean) -> a -> m a
F.result = fn => data => ({ok: fn (data), data});

// left :: a -> m a
F.left = F.result (F.F)

// right :: a -> m a
F.right = F.result (F.T)

// resultOk :: m a -> Boolean
F.resultOk = F.propEq ("ok") (true);

// join :: m a -> a
F.join = F.prop ("data");

// flatMap :: [m a] -> [a]
F.flatMap = F.map (F.join);

// mapM :: (a -> b) -> m a -> m b
// mapM :: (a -> b -> c) -> m a -> m (b -> c)
F.mapM = fn => m => F.when (
    F.resultOk,
    F.compose (F.flip (F.assoc ("data")) (m), fn, F.join)
) (m)

// chain :: (a -> m b) -> m a -> m b
F.chain = fn => F.when (F.resultOk, F.compose (F.join, F.mapM (fn)));
// chain = lambda fn: when(resultOk, compose(join, mapM (fn)))

// ap :: m (a -> b) -> m a -> m b
F.ap = mFn => m => F.when (
    F.resultOk,
    F.compose (F.flip (F.mapM) (m), F.join)
) (mFn);

// liftA2 :: (a -> b -> c) -> m a -> m b -> m c
F.liftA2 = fn => ma => mb => F.compose (
    F.flip (F.ap) (mb),
    F.mapM (fn)
) (ma)

// Monads (Either)
// either :: ((a -> c), (b -> c)) -> m a|b -> c
F.either = (notOk, ok) => m => F.compose (
    F.ifElse(F.always (F.resultOk (m)), ok, notOk), F.join
) (m)

// Monads (Maybe)
// onMaybe :: ((a -> Boolean), (a -> b), (a -> c)) -> a -> m b|c
F.onMaybe = (pred, bad, good) => F.compose (
    F.either (F.compose (F.left, bad), F.compose (F.right, good)),
    F.result (pred)
)

// Monads (Validaion)
// check :: a -> (b -> Boolean) -> c -> abc
F.check = (p, fn, msg) => ({p, fn, msg});

// safeProp :: a -> b -> Either None|b[a]
F.safeProp = k => o =>
    (o.hasOwnProperty(k)) ? F.right (F.prop (k) (o)) : F.left (null);

// safePath :: [a] -> {b} -> m {b}
F.safePath = keys => obj => F.reduce (
    (obj, key) => F.chain (F.safeProp (key)) (obj)
) (F.right (obj)) (keys)

// validate :: a -> [b] -> m a
F.validate = data => F.pipe (
    F.reduce (
        (results, check) => F.pipe (
            F.safeProp (F.prop ("p") (check)),
            F.chain (F.result (F.prop ("fn") (check))),
            F.either (F.compose (F.left, F.always (F.prop ("msg") (check))), F.right),
            F.flip (F.append) (results)
        ) (data)
    ) ([]),
    F.filter (F.complement (F.resultOk)),
    F.flatMap,
    F.ifElse (F.emptyList, F.compose(F.right, F.always (data)), F.left)
)

try { exports.F = F; } catch {}
